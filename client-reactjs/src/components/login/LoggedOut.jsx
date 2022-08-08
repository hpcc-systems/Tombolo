import React from 'react';
import { Row, Col, Button } from 'antd';
import { useHistory } from 'react-router';
import logo from '../../images/logo.png';

function LoggedOut() {
  const history = useHistory();

  const handleLogin = () => {
    history.push('/login');
  };

  return (
    <Row
      style={{
        background: 'linear-gradient(#FFFFFF 30%, #F5F5F5)',
        height: '100vh',
        display: 'flex',
        placeContent: 'center',
        justifyContent: 'center',
      }}>
      <Col xs={22} sm={20} md={15} lg={12} xl={6} style={{ background: 'white', textAlign: 'center', padding: '50px' }}>
        <div style={{ marginBottom: '20px' }}>
          <img src={logo} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>

        <p style={{ fontSize: '22px', fontWeight: '500' }}>You have been logged out.</p>

        <Button size="large" onClick={handleLogin} type="primary">
          Log in again
        </Button>
      </Col>
    </Row>
  );
}

export default LoggedOut;
