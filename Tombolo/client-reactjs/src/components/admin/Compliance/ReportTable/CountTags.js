import React from 'react';
import { Tag, Tooltip } from 'antd';
import Text from '../../../common/Text';

const CountTags = ({ file, reportType = 'current', children }) => {
  const tags = {
    current: [
      ['own', 'green'],
      ['inherited', 'blue'],
    ],
    changes: [
      ['added', 'blue', '+'],
      ['removed', 'red', '-'],
    ],
  };

  const count = file.fields.reduce(
    (acc, el) => {
      [...tags.current, ...tags.changes].forEach(([key]) => {
        if (key in el) acc[key] += el[key]?.length || 0;
      });
      return acc;
    },
    { own: 0, added: 0, removed: 0, inherited: 0 }
  );

  return (
    <>
      {tags[reportType].map(([tagName, color, extra = '']) => {
        return (
          <Tooltip key={tagName} title={<Text>{tagName}</Text>}>
            <Tag color={color}>
              {extra}
              {count[tagName]}
            </Tag>
          </Tooltip>
        );
      })}
      {children}
    </>
  );
};

export default CountTags;
