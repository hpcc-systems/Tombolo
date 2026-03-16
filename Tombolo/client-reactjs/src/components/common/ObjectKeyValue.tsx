import React from 'react';

type Props = { obj: Record<string, any> };

function ObjectKeyValue({ obj }: Props) {
  const keys = Object.keys(obj || {});
  return (
    <>
      {keys.map(key => (
        <div key={key}>
          <span style={{ fontWeight: 'bold' }}> {key} </span>: {obj[key]}
        </div>
      ))}
    </>
  );
}

export default ObjectKeyValue;
