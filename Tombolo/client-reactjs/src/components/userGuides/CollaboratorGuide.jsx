import React from 'react';
import Text from '../common/Text';

function Collaborator() {
  return (
    <div>
      <h2> Collaborator </h2>
      <div>
        To associate consumers, suppliers, and owners with assets, you need to add them first. This is necessary if you
        want to tag an asset with a collaborator.
      </div>

      <div style={{ marginTop: '10px' }}>
        {<Text text="Consumer - Product/Application/Group consuming the asset" />}
      </div>
      <div>{<Text text="Supplied - Supplier of the asset data (DMV, Insurance company etc)" />}</div>
      <div>{<Text text="Owner - Contact Person/Group for an asset" />}</div>
    </div>
  );
}

export default Collaborator;
