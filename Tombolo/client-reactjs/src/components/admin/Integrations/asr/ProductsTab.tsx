import React, { useState, useEffect } from 'react';
import { Table, Space, Popconfirm, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { handleError } from '../../../common/handleResponse';
import asrService from '@/services/asr.service';
import useWindowSize from '@/hooks/useWindowSize';

interface Props {
  products?: any[];
  setSelectedProduct?: (p: any) => void;
  setProductModalOpen?: (open: boolean) => void;
  setProducts?: (ps: any[]) => void;
}

const ProductsTab: React.FC<Props> = ({ products = [], setSelectedProduct, setProductModalOpen, setProducts }) => {
  const [productData, setProductData] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const { inner } = useWindowSize();

  useEffect(() => {
    if (products) {
      const productAndDomain: any[] = [];
      products.forEach((p: any) => {
        productAndDomain.push({
          name: p.name,
          id: p.id,
          tier: p.tier,
          shortCode: p.shortCode,
          domain: { id: p['associatedDomains.id'], name: p['associatedDomains.name'] },
        });
      });

      const organizedData = productAndDomain.reduce((acc: any[], item: any) => {
        const existingEntry = acc.find(entry => entry.id === item.id);
        if (existingEntry) {
          existingEntry.domains.push(item.domain);
        } else {
          acc.push({
            id: item.id,
            name: item.name,
            tier: item.tier,
            shortCode: item.shortCode,
            domains: [item.domain],
          });
        }
        return acc;
      }, []);

      setProductData(organizedData);
    }
  }, [products]);

  useEffect(() => {
    setPageSize(Math.abs(Math.round(inner.height / 62)));
  }, [inner]);

  const handleEdit = (record: any) => {
    setSelectedProduct && setSelectedProduct(record);
    setProductModalOpen && setProductModalOpen(true);
  };

  const handleDelete = async (record: any) => {
    try {
      await asrService.deleteProduct({ id: record.id });
      const updatedProducts = await asrService.getAllProducts();
      setProducts && setProducts(updatedProducts);
    } catch (err) {
      handleError('Failed to delete product');
    }
  };

  const columns = [
    { title: 'Product Name', dataIndex: 'name', key: 'name', width: '15%' },
    { title: 'Short code', dataIndex: 'shortCode', key: 'shortCode', width: '15%' },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: '15%',
      render: (tier: number) => (tier === 0 ? 'No Tier' : `Tier - ${tier}`),
    },
    {
      title: 'Domains',
      dataIndex: 'domains',
      key: 'domains',
      render: (tags: any[]) => (
        <>
          {tags.map(
            (tag, i) =>
              tag.name && (
                <Tag color="blue" key={i}>
                  {tag.name}
                </Tag>
              )
          )}
        </>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <EditOutlined onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record)}
            okButtonProps={{ type: 'primary', danger: true }}>
            <DeleteOutlined />
          </Popconfirm>
        </Space>
      ),
      width: '10%',
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={productData}
        size="small"
        rowKey={record => record.id}
        pagination={{ pageSize }}
      />
    </>
  );
};

export default ProductsTab;
