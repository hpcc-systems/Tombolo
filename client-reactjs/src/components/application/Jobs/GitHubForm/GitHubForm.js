import React  from "react";
import {Button, Divider } from "antd";
import Form from "antd/lib/form/Form";
import GitRepoSection from "./GitHubRepoSection";
import GitHubCredentials from "./GitHubCredentials";

function GitHubForm({ form, enableEdit }) { 
  const repoList = form.current.getFieldValue(['gitHubFiles','reposList']);  
  const disableAddRepository = !repoList?.[repoList.length-1]?.selectedFile // do not allow to add new repos if previous set is not completed


  return (
    <>
      <GitHubCredentials enableEdit={enableEdit}/>
                  
      <Form.List initialValue={[{}]} name={['gitHubFiles','reposList']}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, fieldKey, ...restField },index) => (
              <>
                <GitRepoSection
                  form={form}
                  name={name}
                  remove={remove}
                  fieldKey={fieldKey}
                  restField={restField}
                  enableEdit={enableEdit}
                />
                {fields[index + 1] &&  // if there is another repo fields open then we will show some kind of separator till
                <Form.Item wrapperCol={{ offset: 2, span:8 }}> 
                  <Divider style={{margin:0}} orientation="right" plain>{ enableEdit ?  "Please provide new info below" : ''}</Divider>
                </Form.Item>
                }
              </>
            ))}
            {enableEdit &&
              <Form.Item wrapperCol={{ offset: 2, span:8 }}>
                <div style={{display:'flex', justifyContent:'flex-end'}}>
                  <Button shape="round" disabled={disableAddRepository} size='small' type="primary" onClick={() => add()}> Add New Repository </Button>
                </div>
              </Form.Item>
            }
          </>
        )}
      </Form.List>
    </>
  );
}

export default GitHubForm;
