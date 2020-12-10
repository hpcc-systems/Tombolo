import React from 'react'
import { BarsOutlined  } from '@ant-design/icons';

function TitleRenderer({title, showMoreOptions}) {
  return (
    <li><span className="group-options">{title}<i className="fa fa-bars" onClick={showMoreOptions}></i></span></li>
  )
}

export default TitleRenderer