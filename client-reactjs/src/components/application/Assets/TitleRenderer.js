import React from 'react'
import { BarsOutlined  } from '@ant-design/icons';

function TitleRenderer({title, showMoreOptions, textToHighlight}) {
  const index = title.indexOf(textToHighlight);
  const beforeStr = title.substr(0, index);
  const afterStr = title.substr(index + textToHighlight.length);
  const titleSpan = index > 0 ? (<span>{beforeStr}<span className="groups-tree-search-value">{textToHighlight}</span>{afterStr}</span>)
  : (<span className="group-options">{title}</span>);

  return (
    <li className="group-title">{titleSpan}<i className="fa fa-bars" onClick={showMoreOptions}></i></li>
  )
}

export default TitleRenderer