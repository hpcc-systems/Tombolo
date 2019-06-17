import React from 'react';
import { Table } from 'antd';
import ExpandIcon from './ExpandIcon';
import _ from 'lodash';

const nestedColumns = [
      { title: '', key: '', width: 850 },
      { title: 'modes', width: 200,
        children: [{
          title:"Value",
          width: 100,
          key:"value",
          dataIndex: 'modes',
          render: (modes = []) => (
            <React.Fragment>
            {modes.map((name, index) => <span style={{display: "block"}} key={index}>{name.value}</span>)}
            </React.Fragment>
          )
        },
        {
          title:"Rec Count",
          width: 100,
          key:"rec_count",
          dataIndex: 'modes',
          render: (modes = []) => (
            <React.Fragment>
            {modes.map((name, index) => <span style={{display: "block"}} key={index}>{name.rec_count}</span>)}
            </React.Fragment>
          )
        }]

      },
      { title: 'popular_patterns',
        children: [{
          title:"data_pattern",
          width: 116,      
          key:"data_pattern",
          dataIndex: 'popular_patterns',
          render: (popular_patterns = []) => (
            <React.Fragment>
            {popular_patterns.map((name, index) => <span style={{display: "block"}} key={index}>{name.data_pattern}</span>)}
            </React.Fragment>
          )
        },
        {
          title:"Rec Count",
          width: 116,      
          key:"rec_count_patterns",
          dataIndex: 'popular_patterns',
          render: (popular_patterns = []) => (
            <React.Fragment>
            {popular_patterns.map((name, index) => <span style={{display: "block"}} key={index}>{name.rec_count}</span>)}
            </React.Fragment>
          )
        },
        {
          title:"Example",
          width: 116,      
          key:"example",
          dataIndex: 'popular_patterns',
          render: (popular_patterns = []) => (
            <React.Fragment>
            {popular_patterns.map((name, index) => <span style={{display: "block"}} key={index}>{name.example}</span>)}
            </React.Fragment>
          )
        }]

      },
      { title: 'cardinality_breakdown',
        children: [{
          title:"Value",
          width: 100,
          key:"value_cardinality",
          dataIndex: 'cardinality_breakdown',
          render: (modes = []) => (
            <React.Fragment>
            {modes.map((name, index) => <span style={{display: "block"}} key={index}>{name.value}</span>)}
            </React.Fragment>
          )
        },
        {
          title:"Rec Count",
          width: 100,
          key:"rec_count_cardinality",
          dataIndex: 'cardinality_breakdown',
          render: (modes = []) => (
            <React.Fragment>
            {modes.map((name, index) => <span style={{display: "block"}} key={index}>{name.rec_count}</span>)}
            </React.Fragment>
          )
        }]
      },
      { title: 'rare_patterns',
        children: [{
          width: 150,
          title:"data_pattern",
          key:"data_pattern_rare_patterns",
          dataIndex: 'rare_patterns',
          render: (rare_patterns = []) => (
            <React.Fragment>
            {rare_patterns.map((name, index) => <span style={{display: "block"}} key={index}>{name.data_pattern}</span>)}
            </React.Fragment>
          )
        },
        {
          title:"Rec Count",
          width: 150,
          key:"rec_count_rare_patterns",
          dataIndex: 'rare_patterns',
          render: (rare_patterns = []) => (
            <React.Fragment>
            {rare_patterns.map((name, index) => <span style={{display: "block"}} key={index}>{name.value}</span>)}
            </React.Fragment>
          )
        }]

      },
      { title: 'numeric_correlations',
        children: [{
          title:"attribute",
          key:"numeric_correlations_attribute",
          dataIndex: 'numeric_correlations',
          render: (numeric_correlations = []) => (
            <React.Fragment>
            {numeric_correlations.map((name, index) => <span style={{display: "block"}} key={index}>{name.attribute}</span>)}
            </React.Fragment>
          )
        },
        {
          title:"corr",
          key:"corr",
          dataIndex: 'numeric_correlations',
          render: (numeric_correlations = []) => (
            <React.Fragment>
            {numeric_correlations.map((name, index) => <span style={{display: "block"}} key={index}>{name.corr}</span>)}
            </React.Fragment>
          )
        }]

      }
    ];

  const InnerTable = ({record}) => (
    <Table
      className="Hello--nested-table"
      size="middle"
      columns={nestedColumns}
      dataSource={record}
      pagination={false}
      scroll={{ x: 2000}}
    />
  );

export default class DataProfileTable extends React.Component {
      _expandedRowKeys = new Set();
      constructor(props) {
        super(props);

        this.state = {
          expandedRowKeys: Array.from(this._expandedRowKeys.values())
      };
  }

_expandRowRender = (record) => {
    return (
      <InnerTable record={[record]} />
    );
  }

  _onExpand = (expanded, record) => {
    this._toggleExpandByCaseId(record.attribute);
  };


  _onExpandIconClick = (caseId) => {
    this._toggleExpandByCaseId(caseId);
  }

  _toggleExpandByCaseId = (caseId) => {
    this._expandedRowKeys.has(caseId)
      ? this._expandedRowKeys.delete(caseId)
      : this._expandedRowKeys.add(caseId);

    this.setState({
      expandedRowKeys: Array.from(this._expandedRowKeys.values())
    });
  };

  _getRowClassName = (record) => {
    return _.get(record, 'products.length', 0) > 1 ? '' : 'Hello--hide-expand';
  };



  render() {
  const _columns = [
    { title: 'attribute', width: 100, dataIndex: 'attribute', key: 'attribute' },
    { title: 'types', width: 150, dataIndex: 'given_attribute_type', key: 'type',
      render: (text, row) => (
            <span style={{flexWrap: "wrap"}}>
              <li><b>Given:</b> {row.given_attribute_type}</li>
              <li><b>Best:</b> {row.best_attribute_type}</li>
            </span>
        )
    },
    { title: 'rec_count', key: 'rec_count_main', width: 30 },
    { title: 'fill_rate', key: 'fill_count', width:150,
        render: (text, row) => (
            <span style={{flexWrap: "wrap"}}>
              <li><b>Min:</b> {row.fill_count}</li>
              <li><b>Max:</b> {row.fill_rate}</li>
            </span>
        )
    },
    { title: 'cardinality', key: 'cardinality', width:50 },
    { title: 'lengths', key: 'min_length', width:50,
      render: (text, row) => (
            <span style={{flexWrap: "wrap"}}>
              <li><b>Min:</b> {row.min_length}</li>
              <li><b>Max:</b> {row.max_length}</li>
              <li><b>Avg:</b> {row.ave_length}</li>
            </span>
        )
    },
    { title: 'numeric', width: 150, key: 'is_numeric',
      render: (text, row) => (
          row.is_numeric ? 
            <span style={{flexWrap: "wrap"}}>
              <li><b>Min:</b> {row.numeric_min}</li>
              <li><b>Max:</b> {row.numeric_max}</li>
              <li><b>Mean:</b> {row.numeric_mean}</li>
              <li><b>Median:</b> {row.numeric_median}</li>
              <li><b>Std Dev:</b> {row.numeric_std_dev}</li>
              <li><b>Low Quartile:</b> {row.numeric_lower_quartile}</li>
              <li><b>Upper Quartile:</b> {row.numeric_upper_quartile}</li>
            </span> : ""
        )
    },
    {
      title: 'modes',
      width: 200,
      dataIndex: 'modes',
      render: (modes = [], record) => {
        const { attribute } = record;
        const firstProduct = modes[0];
        const expanded = this._expandedRowKeys.has(attribute);
        const count = modes.length;
        return (
          <span>
            {
              (count > 1) ? <ExpandIcon
                count={count}
                expanded={expanded}
                onClick={() => this._onExpandIconClick(attribute)}/>
               : ""
            }
            {firstProduct ? firstProduct.value : ''}
          </span>
        );
      }
    },
    {
      title: 'popular_patterns',
      width: 350,
      dataIndex: 'popular_patterns',
      render: (popular_patterns = [], record) => {
        const { attribute } = record;
        const firstProduct = popular_patterns[0];
        const expanded = this._expandedRowKeys.has(attribute);
        const count = popular_patterns.length;
        return (
          <span>
            {
              (count > 1) ? <ExpandIcon
                count={count}
                expanded={expanded}
                onClick={() => this._onExpandIconClick(attribute)}/>
               : ""
            }
            {firstProduct ? firstProduct.data_pattern : ''}
          </span>
        );
      }
    },
    {
      title: 'cardinality_breakdown',
      width: 200,
      dataIndex: 'cardinality_breakdown',
      render: (cardinality_breakdown = [], record) => {
        const { attribute } = record;
        const firstProduct = cardinality_breakdown[0];
        const expanded = this._expandedRowKeys.has(attribute);
        const count = cardinality_breakdown.length;
        return (
          <span>
            {
              (count > 1) ? <ExpandIcon
                count={count}
                expanded={expanded}
                onClick={() => this._onExpandIconClick(attribute)}/>
               : ""
            }
            {firstProduct ? firstProduct.value : ''}
          </span>
        );
      }
    },
    {
      title: 'rare_patterns',
      width: 300,
      dataIndex: 'rare_patterns',
      render: (rare_patterns = [], record) => {
        const { attribute } = record;
        const firstProduct = rare_patterns[0];
        const expanded = this._expandedRowKeys.has(attribute);
        const count = rare_patterns.length;
        return (
          <span>
            {
              (count > 1) ? <ExpandIcon
                count={count}
                expanded={expanded}
                onClick={() => this._onExpandIconClick(attribute)}/>
               : ""
            }
            {firstProduct ? firstProduct.data_pattern : ''}
          </span>
        );
      }
    },
    {
      title: 'numeric_correlations',
      dataIndex: 'numeric_correlations',
      render: (numeric_correlations = [], record) => {
        const { attribute } = record;
        const firstProduct = numeric_correlations[0];
        const expanded = this._expandedRowKeys.has(attribute);
        const count = numeric_correlations.length;
        return (
          <span>
            {
              (count > 1) ? <ExpandIcon
                count={count}
                expanded={expanded}
                onClick={() => this._onExpandIconClick(attribute)}/>
               : ""
            }
            {firstProduct ? firstProduct.attribute : ''}
          </span>
        );
      }
    }
  ];
    return (
      <div id="profileTable">
        <Table
          className="Hello"
          bordered
          rowKey="attribute"
          rowClassName={this._getRowClassName}
          expandedRowRender={this._expandRowRender}
          expandedRowKeys={this.state.expandedRowKeys}
          onExpand={this._onExpand}
          columns={_columns}
          dataSource={this.props.data}
          pagination={{ pageSize: 10 }} scroll={{ x: 2000}}
        />
      </div>
    );
  }
}
