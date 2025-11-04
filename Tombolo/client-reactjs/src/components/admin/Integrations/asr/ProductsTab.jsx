// Package imorts
import React, { useState, useEffect } from 'react';
import { Table, Space, Popconfirm, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { handleError } from '../../../common/handleResponse';

// Local imports
import asrService from '@/services/asr.service';
import useWindowSize from '@/hooks/useWindowSize';

const ProductsTab = ({ products, setSelectedProduct, setProductModalOpen, setProducts }) => {
  // Local State
  const [productData, setProductData] = useState([]);
  const [pageSize, setPageSize] = useState(null);
  const { inner } = useWindowSize();

  // Effect
  useEffect(() => {
    if (products) {
      const productAndDomain = [];
      products.forEach((p) => {
        productAndDomain.push({
          name: p.name,
          id: p.id,
          tier: p.tier,
          shortCode: p.shortCode,
          domain: { id: p['associatedDomains.id'], name: p['associatedDomains.name'] },
        });
      });

      const organizedData = productAndDomain.reduce((acc, item) => {
        // Find an existing entry for the current id
        const existingEntry = acc.find((entry) => entry.id === item.id);

        if (existingEntry) {
          // If an entry exists, add the current activityType to its activityTypes array
          existingEntry.domains.push(item.domain);
        } else {
          // If no entry exists, create a new one with the current item's id, name, and activityType
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

  // Effect
  useEffect(() => {
    setPageSize(Math.abs(Math.round(inner.height / 62)));
  }, [inner]);

  // Product table columns
  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      width: '15%',
    },
    {
      title: 'Short code',
      dataIndex: 'shortCode',
      key: 'shortCode',
      width: '15%',
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: '15%',
      render: (tier) => {
        return tier === 0 ? 'No Tier' : `Tier - ${tier}`;
      },
    },
    {
      title: 'Domains',
      dataIndex: 'domains',
      key: 'domains',
      render: (tags) => (
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
      render: (text, record) => (
        <Space size="middle">
          <EditOutlined onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record)}
            okButtonProps={{ type: 'primary', danger: true }}>
            <DeleteOutlined type="delete" />
          </Popconfirm>
        </Space>
      ),
      width: '10%',
    },
  ];

  // When edit icon is clicked
  const handleEdit = (record) => {
    setSelectedProduct(record);
    setProductModalOpen(true);
  };

  // Handle product deletion
  const handleDelete = async (record) => {
    try {
      await asrService.deleteProduct({ id: record.id });
      const updatedProducts = await asrService.getAllProducts();
      setProducts(updatedProducts);
    } catch (err) {
      handleError('Failed to delete product');
    }
  };

  // JSX
  return (
    <>
      <Table
        columns={columns}
        dataSource={productData}
        size="small"
        rowKey={(record) => record.id}
        pagination={{ pageSize }}
      />
    </>
  );
};

export default ProductsTab;
