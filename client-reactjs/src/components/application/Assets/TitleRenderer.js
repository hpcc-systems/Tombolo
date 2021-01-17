import React from 'react'
import { BarsOutlined  } from '@ant-design/icons';

function TitleRenderer({title, id, nodeKey, showMoreOptions}) {
  const titleSpan = <span className="group-options">{title}</span>;
  return (
    <li className="group-title">{titleSpan}<i className="fa fa-bars" data-id={id} data-key={nodeKey} onClick={showMoreOptions}></i></li>
  )
}

export default TitleRenderer