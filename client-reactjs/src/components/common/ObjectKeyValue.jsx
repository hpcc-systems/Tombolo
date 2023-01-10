import React from 'react';

function ObjectKeyValue({ obj }) {
  console.log(Object.keys(obj));
  const keys = Object.keys(obj);
  return (
    <>
      {keys.map((key) => (
        <div key={key}>
          <span style={{ fontWeight: 'bold' }}> {key} </span>: {obj[key]}
        </div>
      ))}
    </>
  );
}

export default ObjectKeyValue;
