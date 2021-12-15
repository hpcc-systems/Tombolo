import React  from "react";
import GHCredentials from "./GHCredentials";
import GHFormFields from "./GHFormFields";
import Form from "antd/lib/form/Form";
import GHTable from "./GHTable";

function GitHubForm({ form, enableEdit }) { 
  return (
    <>
      {enableEdit ?
        <>
          <GHCredentials enableEdit={enableEdit}/>
          <GHFormFields form={form} enableEdit={enableEdit} />
           <Form.Item shouldUpdate wrapperCol={{ offset: 2, span: 11 }}>
            {()=> <GHTable form={form} enableEdit={enableEdit} /> }
          </Form.Item>
        </>
      : null}
    </>
  );
}

export default GitHubForm;
