import React from 'react'
import { BarsOutlined  } from '@ant-design/icons';

function TitleRenderer({title, showMoreOptions}) {
  return (
    <li className="group-title"><span className="group-options">{title}</span><i className="fa fa-bars" onClick={showMoreOptions}></i></li>
  )
}

export default TitleRenderer