import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { expect } from 'vitest';

type TitleCase = {
  title: string;
  props?: Record<string, unknown>;
};

type AssertModalTitlesParams = {
  rerender: (ui: ReactElement) => void;
  renderModal: (props?: Record<string, unknown>) => ReactElement;
  cases: TitleCase[];
};

export const assertModalTitles = ({ rerender, renderModal, cases }: AssertModalTitlesParams) => {
  for (const titleCase of cases) {
    rerender(renderModal(titleCase.props));
    expect(screen.getByTestId('title')).toHaveTextContent(titleCase.title);
  }
};
