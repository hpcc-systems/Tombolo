import { useEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react';
import { Button, Card, Drawer, Dropdown, Input, Space, Typography } from 'antd';
import {
  ArrowUpOutlined,
  CopyOutlined,
  EditOutlined,
  MoreOutlined,
  RobotOutlined,
  StopOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { format as formatSql } from 'sql-formatter';
import { apiClient } from '@/services/api';
import styles from './AiAssistantDrawer.module.css';

const { Text } = Typography;

const renderInlineMarkdown = (line: string): ReactNode[] => {
  const tokens: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    const before = line.slice(lastIndex, match.index);
    if (before) {
      tokens.push(before);
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <Text key={`${match.index}-bold`} strong>
          {token.slice(2, -2)}
        </Text>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <Text key={`${match.index}-code`} code>
          {token.slice(1, -1)}
        </Text>
      );
    } else {
      tokens.push(token);
    }

    lastIndex = match.index + token.length;
  }

  const tail = line.slice(lastIndex);
  if (tail) {
    tokens.push(tail);
  }

  return tokens;
};

const renderAssistantContent = (content: string): ReactNode => {
  const normalized = content
    // Put numbered items on their own line when model returns inline markdown list
    .replace(/\s(\d+\.\s+)/g, '\n$1')
    .replace(/\r\n/g, '\n')
    .trim();

  const lines = normalized.split('\n').filter(line => line.length > 0);
  return (
    <div>
      {lines.map((line, idx) => {
        const numbered = line.match(/^(\d+\.\s+)(.*)$/);
        const bullet = line.match(/^[-*]\s+(.*)$/);

        if (numbered) {
          return (
            <div key={`line-${idx}`}>
              <Text>{numbered[1]}</Text>
              <Text>{renderInlineMarkdown(numbered[2])}</Text>
            </div>
          );
        }

        if (bullet) {
          return (
            <div key={`line-${idx}`}>
              <Text>{'• '}</Text>
              <Text>{renderInlineMarkdown(bullet[1])}</Text>
            </div>
          );
        }

        return (
          <div key={`line-${idx}`}>
            <Text>{renderInlineMarkdown(line)}</Text>
          </div>
        );
      })}
    </div>
  );
};

export interface SchemaColumn {
  name: string;
  type: string;
}

export type SchemaData = Record<string, SchemaColumn[]>;

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  isResultSet?: boolean;
}

interface PersistedAssistantState {
  chatMessages: ChatMessage[];
  promptHistory: string[];
}

export interface AiAssistantDrawerProps {
  // Drawer open/close control
  open: boolean;
  onClose: () => void;

  // Drawer appearance
  title?: ReactNode;
  width?: number;
  placement?: 'right' | 'left' | 'top' | 'bottom';

  // Chat behaviour
  initialMessage?: string;
  placeholder?: string;

  // Schema / context for AI
  schemaData?: SchemaData | null;
  assistantContext?: string;

  // Backend API endpoint to POST the message to.
  // Defaults to '/workunitAnalytics/assistant'.
  apiEndpoint?: string;

  // SQL result actions — provide when the drawer is opened from a SQL-aware context
  onApplySql?: (sql: string, shouldExecute: boolean) => Promise<void> | void;
  applyButtonLabel?: string;
  applyAndExecuteButtonLabel?: string;

  // Executes SQL and returns rows so results can be queried in the chat
  onExecuteSql?: (sql: string) => Promise<Record<string, unknown>[]>;

  // Current SQL from the editor to include as context for diagnostics/help
  currentEditorSql?: string;

  // Disable SQL fallback and SQL rendering when using the drawer for non-SQL assistants.
  enableSqlFeatures?: boolean;
}

const buildInitialChatMessages = (initialMessage: string, initialId: number): ChatMessage[] => [
  {
    id: initialId,
    role: 'assistant',
    content: initialMessage,
  },
];

const isValidChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === 'number' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string'
  );
};

const AiAssistantDrawer: FC<AiAssistantDrawerProps> = ({
  open,
  onClose,
  title = (
    <Space>
      <RobotOutlined />
      SQL Assistant
    </Space>
  ),
  width = 440,
  placement = 'right',
  initialMessage = 'How can I help you?',
  placeholder,
  schemaData = null,
  assistantContext,
  apiEndpoint = '/workunitAnalytics/assistant',
  onApplySql,
  applyButtonLabel = 'Add to editor',
  applyAndExecuteButtonLabel = 'Execute',
  onExecuteSql,
  currentEditorSql,
  enableSqlFeatures = true,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [chatLoading, setChatLoading] = useState(false);
  const [sqlRunningId, setSqlRunningId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const chatMessagesWrapRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedPersistedStateRef = useRef(false);
  const nextChatMessageIdRef = useRef<number>(Date.now());
  const getNextChatMessageId = () => ++nextChatMessageIdRef.current;
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    buildInitialChatMessages(initialMessage, nextChatMessageIdRef.current)
  );

  const storageKey = useMemo(() => {
    if (typeof window === 'undefined') {
      return `tombolo.aiAssistant.${apiEndpoint}`;
    }

    return `tombolo.aiAssistant.${window.location.pathname}.${apiEndpoint}`;
  }, [apiEndpoint]);

  const knownTables = useMemo(() => Object.keys(schemaData || {}), [schemaData]);

  const resetChatState = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setChatLoading(false);
    setSqlRunningId(null);
    setChatInput('');
    setPromptHistory([]);
    setHistoryIndex(-1);
    setEditingMessageId(null);
    setEditingPrompt('');
    setChatMessages(buildInitialChatMessages(initialMessage, getNextChatMessageId()));
  };

  const clearChatHistory = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }

    resetChatState();
  };

  const drawerTitle = (
    <div className={styles.chatDrawerTitle}>
      <div className={styles.chatDrawerTitleContent}>{title}</div>
      <Dropdown
        trigger={['hover', 'click']}
        menu={{
          items: [
            {
              key: 'clear-chat',
              label: 'Clear chat',
            },
          ],
          onClick: ({ key }) => {
            if (key === 'clear-chat') {
              clearChatHistory();
            }
          },
        }}>
        <Button
          type="text"
          size="small"
          className={styles.chatDrawerMenuButton}
          icon={<MoreOutlined />}
          aria-label="Chat actions"
        />
      </Dropdown>
    </div>
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawState = window.localStorage.getItem(storageKey);
      if (!rawState) {
        setChatMessages(buildInitialChatMessages(initialMessage, getNextChatMessageId()));
        setPromptHistory([]);
        return;
      }

      const parsed = JSON.parse(rawState) as Partial<PersistedAssistantState>;
      const persistedMessages = Array.isArray(parsed.chatMessages)
        ? parsed.chatMessages.filter(isValidChatMessage)
        : [];
      const persistedPromptHistory = Array.isArray(parsed.promptHistory)
        ? parsed.promptHistory.filter((entry): entry is string => typeof entry === 'string')
        : [];

      if (persistedMessages.length > 0) {
        const maxPersistedId = persistedMessages.reduce(
          (max, message) => Math.max(max, message.id),
          nextChatMessageIdRef.current
        );
        nextChatMessageIdRef.current = Math.max(nextChatMessageIdRef.current, maxPersistedId);
      }

      setChatMessages(persistedMessages.length > 0 ? persistedMessages : buildInitialChatMessages(initialMessage, getNextChatMessageId()));
      setPromptHistory(persistedPromptHistory);
    } catch {
      setChatMessages(buildInitialChatMessages(initialMessage, getNextChatMessageId()));
      setPromptHistory([]);
    } finally {
      hasLoadedPersistedStateRef.current = true;
    }
  }, [initialMessage, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedPersistedStateRef.current) {
      return;
    }

    const persistedState: PersistedAssistantState = {
      chatMessages,
      promptHistory,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(persistedState));
  }, [chatMessages, promptHistory, storageKey]);

  useEffect(() => {
    if (!open) return;
    const container = chatMessagesWrapRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, chatLoading, open]);

  const stripSqlFences = (text: string): string => text.replace(/```sql\s*[\s\S]*?```/gi, '').trim();

  const normalizeSqlForComparison = (value: string): string => value.replace(/\s+/g, ' ').trim().toLowerCase();

  const isStatementFollowUpRequest = (request: string): boolean =>
    /\b(this|that|same|previous|earlier|above|it)\b.*\b(sql|query|statement)\b|\b(sql|query|statement)\b.*\b(this|that|same|previous|earlier|above|it)\b/i.test(
      request
    );

  const getLastSqlFromHistory = (messages: ChatMessage[]): string | undefined => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const candidate = messages[i]?.sql?.trim();
      if (candidate) {
        return candidate;
      }
    }
    return undefined;
  };

  const isSqlRequest = (request: string): boolean => {
    const lowerRequest = request.toLowerCase();

    if (/\b(what|why|how|explain|fix|debug|wrong|error|issue)\b/.test(lowerRequest)) {
      return false;
    }

    return /(\bsql\b|\bquery\b|\bselect\b|write\s+sql|generate\s+sql|build\s+sql|create\s+query|give\s+me\s+sql|give\s+me\s+query)/i.test(
      request
    );
  };

  const getDefaultExecutableSql = (): string => {
    if (schemaData?.work_units?.length) {
      const preferredColumns = ['wuId', 'clusterId', 'state', 'workUnitTimestamp'];
      const available = schemaData.work_units.map(c => c.name);
      const selectedColumns = preferredColumns.filter(c => available.includes(c));
      const columns = selectedColumns.length ? selectedColumns.join(', ') : available.slice(0, 4).join(', ');
      const orderBy = available.includes('workUnitTimestamp') ? 'workUnitTimestamp' : available[0];

      return `SELECT ${columns}\nFROM work_units\nORDER BY ${orderBy} DESC\nLIMIT 50`;
    }

    const tables = Object.keys(schemaData || {});
    if (tables.length > 0) {
      const table = tables[0];
      const columns =
        (schemaData?.[table] || [])
          .slice(0, 4)
          .map(c => c.name)
          .join(', ') || '*';
      return `SELECT ${columns}\nFROM ${table}\nLIMIT 50`;
    }

    return 'SELECT 1';
  };

  const getAssistantResponse = async (
    request: string,
    priorMessages: ChatMessage[],
    signal?: AbortSignal
  ): Promise<{ content: string; sql?: string }> => {
    try {
      // Build conversation history from previous messages (skip initial greeting)
      const history = priorMessages
        .slice(1) // skip the initial assistant greeting
        .slice(-20) // truncate to avoid token limits
        .map(msg => ({ role: msg.role, content: msg.content }));

      const editorSql = currentEditorSql?.trim();
      const lastChatSql = getLastSqlFromHistory(priorMessages);
      const followUpRequest = isStatementFollowUpRequest(request);
      const preferredSql = followUpRequest ? lastChatSql || editorSql : editorSql || lastChatSql;

      const contextParts = [assistantContext].filter(Boolean) as string[];
      if (editorSql) {
        contextParts.push(`Current SQL in editor:\n\`\`\`sql\n${editorSql}\n\`\`\``);
      }
      if (lastChatSql) {
        contextParts.push(`Most recent SQL from chat:\n\`\`\`sql\n${lastChatSql}\n\`\`\``);
      }
      if (preferredSql) {
        contextParts.push(
          `Reference SQL to use for this reply:\n\`\`\`sql\n${preferredSql}\n\`\`\`\nUse this exact statement for explanation/follow-up. Do not switch to a different statement unless the user asks explicitly.`
        );
      }

      const enhancedContext = contextParts.join('\n\n');

      const response = await apiClient.post(
        apiEndpoint,
        {
          message: request,
          assistantContext: enhancedContext,
          ...(schemaData && { schemaData }),
          conversationHistory: history,
        },
        {
          signal,
        }
      );

      if (response?.data?.content) {
        return {
          content: String(response.data.content),
          sql: response.data.sql ? String(response.data.sql) : undefined,
        };
      }
    } catch (error) {
      if ((error as { name?: string })?.name === 'CanceledError' || signal?.aborted) {
        throw error;
      }
      throw error;
    }

    return { content: 'I could not generate a response right now.', sql: undefined };
  };

  const submitAssistantMessage = async () => {
    const request = chatInput.trim();
    if (!request) return;

    const priorMessages = [...chatMessages];

    setPromptHistory(prev => [request, ...prev]);
    setHistoryIndex(-1);
    setChatInput('');
    const userMessage: ChatMessage = {
      id: getNextChatMessageId(),
      role: 'user',
      content: request,
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatLoading(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const answer = await getAssistantResponse(request, priorMessages, abortController.signal);
      if (abortController.signal.aborted) {
        return;
      }
      // Attach fallback SQL only when user explicitly asked for SQL/query generation.
      const fallbackSql =
        enableSqlFeatures && !answer.sql && isSqlRequest(request) ? getDefaultExecutableSql() : undefined;
      const resolvedSql = answer.sql || fallbackSql;

      const assistantMessage: ChatMessage = {
        id: getNextChatMessageId(),
        role: 'assistant',
        content: stripSqlFences(answer.content) || (resolvedSql ? 'Suggested SQL is shown below.' : 'Done.'),
        sql: resolvedSql,
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      if ((error as { name?: string })?.name === 'CanceledError' || abortController.signal.aborted) {
        return;
      }

      const errorMessage = String((error as { message?: string })?.message || '');
      const errorCode = (error as { code?: string })?.code;
      const modelUnavailable =
        errorCode === 'MODEL_UNAVAILABLE' ||
        /not configured|unavailable|econnrefused|network error|timeout|failed to fetch/i.test(errorMessage);
      const unavailableText =
        'Azure OpenAI is not available right now. Check AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, and AZURE_OPENAI_API_VERSION.';

      setChatMessages(prev => [
        ...prev,
        {
          id: getNextChatMessageId(),
          role: 'assistant',
          content: modelUnavailable ? unavailableText : 'I could not generate a response right now. Please try again.',
        },
      ]);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setChatLoading(false);
    }
  };

  const startEditingPrompt = (message: ChatMessage) => {
    if (chatLoading || message.role !== 'user') {
      return;
    }

    setEditingMessageId(message.id);
    setEditingPrompt(message.content);
  };

  const cancelEditingPrompt = () => {
    setEditingMessageId(null);
    setEditingPrompt('');
  };

  const copyPromptToClipboard = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      window.setTimeout(() => {
        setCopiedMessageId(current => (current === message.id ? null : current));
      }, 1200);
    } catch {
      setCopiedMessageId(null);
    }
  };

  const resendEditedPrompt = async (messageId: number) => {
    if (chatLoading) {
      return;
    }

    const request = editingPrompt.trim();
    if (!request) {
      return;
    }

    const editedIndex = chatMessages.findIndex(message => message.id === messageId && message.role === 'user');
    if (editedIndex < 0) {
      return;
    }

    const priorMessages = chatMessages.slice(0, editedIndex);
    const editedUserMessage: ChatMessage = {
      ...chatMessages[editedIndex],
      content: request,
    };

    setPromptHistory(prev => [request, ...prev]);
    setHistoryIndex(-1);
    setEditingMessageId(null);
    setEditingPrompt('');
    setChatInput('');
    setChatMessages([...priorMessages, editedUserMessage]);
    setChatLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const answer = await getAssistantResponse(request, priorMessages, abortController.signal);
      if (abortController.signal.aborted) {
        return;
      }

      const fallbackSql =
        enableSqlFeatures && !answer.sql && isSqlRequest(request) ? getDefaultExecutableSql() : undefined;
      const resolvedSql = answer.sql || fallbackSql;

      const assistantMessage: ChatMessage = {
        id: getNextChatMessageId(),
        role: 'assistant',
        content: stripSqlFences(answer.content) || (resolvedSql ? 'Suggested SQL is shown below.' : 'Done.'),
        sql: resolvedSql,
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      if ((error as { name?: string })?.name === 'CanceledError' || abortController.signal.aborted) {
        return;
      }

      const errorMessage = String((error as { message?: string })?.message || '');
      const errorCode = (error as { code?: string })?.code;
      const modelUnavailable =
        errorCode === 'MODEL_UNAVAILABLE' ||
        /not configured|unavailable|econnrefused|network error|timeout|failed to fetch/i.test(errorMessage);
      const unavailableText =
        'Azure OpenAI is not available right now. Check AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, and AZURE_OPENAI_API_VERSION.';

      setChatMessages(prev => [
        ...prev,
        {
          id: getNextChatMessageId(),
          role: 'assistant',
          content: modelUnavailable ? unavailableText : 'I could not generate a response right now. Please try again.',
        },
      ]);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setChatLoading(false);
    }
  };

  const stopAssistantMessage = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setChatLoading(false);
  };

  const runSqlInChat = async (msgId: number, sql: string) => {
    if (!onExecuteSql) return;
    setSqlRunningId(msgId);
    try {
      const rows = await onExecuteSql(sql);
      const capped = rows.slice(0, 50);
      const colCount = capped.length > 0 ? Object.keys(capped[0]).length : 0;
      const summary =
        `SQL returned ${rows.length} row${rows.length !== 1 ? 's' : ''}` +
        (rows.length > 50 ? ' (showing first 50)' : '') +
        (colCount > 0 ? `, ${colCount} column${colCount !== 1 ? 's' : ''}` : '') +
        ':\n' +
        JSON.stringify(capped, null, 2);

      const resultMessage: ChatMessage = {
        id: getNextChatMessageId(),
        role: 'assistant',
        content: summary,
        isResultSet: true,
      };
      setChatMessages(prev => [...prev, resultMessage]);
    } catch (err) {
      const msg = String((err as { message?: string })?.message || 'Failed to execute SQL.');
      setChatMessages(prev => [
        ...prev,
        { id: getNextChatMessageId(), role: 'assistant', content: `Error running SQL: ${msg}`, isResultSet: true },
      ]);
    } finally {
      setSqlRunningId(null);
    }
  };

  return (
    <Drawer
      title={drawerTitle}
      placement={placement}
      width={width}
      open={open}
      onClose={onClose}
      styles={{
        body: {
          paddingBottom: 0,
        },
      }}>
      <div className={styles.chatDrawerBody}>
        <div className={styles.chatMessagesWrap} ref={chatMessagesWrapRef}>
          {chatMessages.map(msg => (
            <div
              key={msg.id}
              className={`${styles.chatMessageRow} ${msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant} ${msg.sql ? styles.chatMessageWithSql : ''}`}>
              <Card
                size="small"
                className={`${styles.chatMessageCard}${msg.isResultSet ? ` ${styles.chatMessageResultSet}` : ''}`}>
                {msg.role === 'user' ? (
                  <>
                    <div className={styles.chatUserMessageHeader}>
                      {editingMessageId === msg.id ? (
                        <Input.TextArea
                          autoSize={{ minRows: 1, maxRows: 6 }}
                          value={editingPrompt}
                          onChange={event => setEditingPrompt(event.target.value)}
                          className={styles.chatUserEditInput}
                          onKeyDown={event => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              void resendEditedPrompt(msg.id);
                            }
                          }}
                        />
                      ) : (
                        <Text>{msg.content}</Text>
                      )}
                      {editingMessageId !== msg.id && (
                        <div className={styles.chatUserMessageActions}>
                          <Button
                            type="default"
                            shape="circle"
                            size="small"
                            className={styles.chatPromptActionButton}
                            icon={<CopyOutlined />}
                            onClick={() => void copyPromptToClipboard(msg)}
                            aria-label="Copy prompt"
                            title={copiedMessageId === msg.id ? 'Copied' : 'Copy prompt'}
                            disabled={chatLoading}
                          />
                          <Button
                            type="default"
                            shape="circle"
                            size="small"
                            className={styles.chatPromptActionButton}
                            icon={<EditOutlined />}
                            onClick={() => startEditingPrompt(msg)}
                            aria-label="Edit prompt"
                            title="Edit prompt"
                            disabled={chatLoading}
                          />
                        </div>
                      )}
                    </div>
                    {editingMessageId === msg.id && (
                      <div className={styles.chatUserEditActions}>
                        <Button size="small" onClick={cancelEditingPrompt} disabled={chatLoading}>
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          icon={<ArrowUpOutlined />}
                          onClick={() => resendEditedPrompt(msg.id)}
                          disabled={!editingPrompt.trim() || chatLoading}
                          loading={chatLoading}>
                          Send again
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  renderAssistantContent(msg.content)
                )}
                {enableSqlFeatures &&
                  msg.sql &&
                  (() => {
                    const editorLineHeight = 19;
                    const editorTopPadding = 12;
                    const editorBottomPadding = editorLineHeight * 2 + 6;
                    let displaySql = msg.sql;
                    try {
                      displaySql = formatSql(msg.sql, { language: 'mysql', tabWidth: 2, keywordCase: 'upper' });
                    } catch {
                      /* keep original */
                    }
                    const editorHeight = `${Math.min(
                      Math.max(
                        displaySql.split('\n').length * editorLineHeight + editorTopPadding + editorBottomPadding,
                        58
                      ),
                      360
                    )}px`;
                    return (
                      <div className={styles.chatSqlEditorWrap}>
                        <Editor
                          height={editorHeight}
                          defaultLanguage="sql"
                          value={displaySql}
                          theme="vs-dark"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 12,
                            lineNumbers: 'off',
                            glyphMargin: false,
                            scrollBeyondLastLine: false,
                            padding: { top: editorTopPadding, bottom: editorBottomPadding },
                            scrollbar: {
                              vertical: 'auto',
                              horizontal: 'auto',
                            },
                            wordWrap: 'on',
                            automaticLayout: true,
                          }}
                        />
                        {(onApplySql || onExecuteSql) && (
                          <div className={styles.chatSqlEditorActions}>
                            {onApplySql && (
                              <Button size="small" onClick={() => onApplySql(msg.sql!, false)}>
                                {applyButtonLabel}
                              </Button>
                            )}
                            {onApplySql && (
                              <Button size="small" type="primary" onClick={() => onApplySql(msg.sql!, true)}>
                                {applyAndExecuteButtonLabel}
                              </Button>
                            )}
                            {onExecuteSql && (
                              <Button
                                size="small"
                                loading={sqlRunningId === msg.id}
                                onClick={() => runSqlInChat(msg.id, msg.sql!)}>
                                Run in Chat
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </Card>
            </div>
          ))}

          {chatLoading && (
            <div className={`${styles.chatMessageRow} ${styles.chatMessageAssistant}`}>
              <Card size="small" className={styles.chatMessageCard}>
                <div className={styles.thinkingDots}>
                  <span />
                  <span />
                  <span />
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className={styles.chatInputBar}>
          <div className={styles.chatComposer}>
            <Input.TextArea
              bordered={false}
              rows={3}
              className={styles.chatComposerInput}
              style={{ resize: 'none' }}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (chatLoading) {
                    stopAssistantMessage();
                  } else {
                    submitAssistantMessage();
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (promptHistory.length === 0) return;
                  const next = Math.min(historyIndex + 1, promptHistory.length - 1);
                  setHistoryIndex(next);
                  setChatInput(promptHistory[next]);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (historyIndex <= 0) {
                    setHistoryIndex(-1);
                    setChatInput('');
                  } else {
                    const next = historyIndex - 1;
                    setHistoryIndex(next);
                    setChatInput(promptHistory[next]);
                  }
                }
              }}
              placeholder={
                placeholder ??
                (knownTables.length
                  ? `Ask for SQL using available tables: ${knownTables.slice(0, 3).join(', ')}${knownTables.length > 3 ? '...' : ''}`
                  : 'Ask a question or describe the query you want...')
              }
            />

            <div className={styles.chatComposerFooter}>
              <Button
                type="primary"
                shape="circle"
                size="small"
                className={styles.chatSendButton}
                icon={chatLoading ? <StopOutlined /> : <ArrowUpOutlined />}
                onClick={chatLoading ? stopAssistantMessage : submitAssistantMessage}
                disabled={!chatLoading && !chatInput.trim()}
              />
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default AiAssistantDrawer;
