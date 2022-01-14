import React, { useEffect } from "react";
import { Row, Col, Button, Space } from "antd";
import { useHistory } from "react-router";
import { useMsal } from "@azure/msal-react";
import logo from "../../images/logo.png";

function LoggedOut() {
  const history = useHistory();
  const { instance, accounts, inProgress } = useMsal();

  useEffect(() => {
    console.log(
      "<<<<<<<<<<<<<<< Logged out accounts <<<<<<<<<<<<<<<<<<<<<<<<<<<<"
    );
    console.log(accounts);
    instance.setActiveAccount({});

    console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
  }, []);

  const handleLogin = () => {
    history.push("/login");
  };

  return (
    <Row
      style={{
        background: "linear-gradient(white 30%, lightgray",
        height: "100vh",
        display: "flex",
        placeContent: "center",
        justifyContent: "center",
      }}
    >
      <Col
        xs={22}
        sm={20}
        md={15}
        lg={12}
        xl={6}
        style={{ background: "white", textAlign: "center", padding: "50px" }}
      >
        <div style={{ marginBottom: "20px" }}>
          <img src={logo} />
        </div>

        <p style={{ fontSize: "22px", fontWeight: "700" }}>
          You have been logged out.
        </p>

        <Button
          size="large"
          block
          onClick={handleLogin}
          type="primary"
          style={{ fontSize: "18px", fontWeight: "600", letterSpacing: "1px" }}
        >
          Log in again
        </Button>
        <div
          style={{
            display: "flex",
            placeItems: "center",
            justifyContent: "space-around",
            marginTop: "6px",
          }}
        >
          Note: You may still be logged into your Identity Provider.
        </div>
      </Col>
    </Row>
  );
}

export default LoggedOut;
