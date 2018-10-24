import {html} from '@polymer/polymer';
import {List} from './list.js';
import './integration-detail.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-button/vaadin-button.js';
import '@vaadin/vaadin-dialog/vaadin-dialog.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-icon/iron-icon.js';

class IntegrationList extends List {
    
    static get properties() {
        return {
            data: Object,
            app_id: String
        }; 
    }

    static get template() {
        return html`
      <style include="shared-styles">
        :host {
          display: block;

          padding: 10px;
        }
      </style>
      
      <iron-ajax id="ajaxFiles" url="/api/integration/read/integration_list"  handle-as="json" last-response="{{data}}"></iron-ajax>
      
      <div class="card">
        <h1>Integrations</h1>
        <!-- Fetch an array of users to be shown in the grid -->
        
    
        <!-- The array is set as the <vaadin-grid>'s "items" property -->
        <vaadin-grid aria-label="Basic Binding Example" items="[[data]]">
    
  
          <vaadin-grid-column>
            <template class="header">Title</template>
            <template>[[item.title]]</template>
          </vaadin-grid-column>

          <vaadin-grid-column>
            <!-- type = DB, LZ, SFTP, Kafka, Gateway (pull)  -->
            <template class="header">Default Type</template> <!-- This can be injected by the workflow --> 
            <template>[[item.defaultType]]</template>
          </vaadin-grid-column>

          <vaadin-grid-column>
            <template class="header">Output File</template>
            <template>[[item.outputFileId]]</template>
          </vaadin-grid-column>
    
          <vaadin-grid-column width="20em">
            <template class="header">Description</template>
            <template>
              <div style="white-space: normal">[[item.description]]</div>
            </template>
          </vaadin-grid-column>

          <vaadin-grid-column width="14em">
          <template>
            <div style="text-align: right;">
              <vaadin-button id="edit-button" on-click="openDialog" theme="icon" aria-label="Edit">Edit</vaadin-button>
              <vaadin-button  on-click="_remove" theme="icon error" aria-label="Delete">Delete</vaadin-button>
            </div>
          </template>
        </vaadin-grid-column>
    
        </vaadin-grid>
      
      </div>
 
      <integration-detail id="detail"> </integration-detail>
    `;
    }

    ready() {
        super.ready();
    }

    activeChanged() {
        if (this.active) {
            console.log('active app_id = ' + this.app_id);
            this.$.ajaxFiles.set( 'params', {"app_id": this.app_id});
            this.$.ajaxFiles.generateRequest();
        }
    }

    openDialog(e) {
        const model = e.model;
        console.log('open dialog called, with file_id = ' + model.item._id);
        this.$.detail.open(model.item._id);
    }

    closeDialog() {
        console.log('close dialog called');
        this.$.dialog.opened = false;
    }
}

window.customElements.define('integration-list', IntegrationList);