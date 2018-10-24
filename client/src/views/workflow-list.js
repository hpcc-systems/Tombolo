import {html} from '@polymer/polymer';
import {List} from './list.js';
import './file-detail.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-button/vaadin-button.js';
import '@vaadin/vaadin-dialog/vaadin-dialog.js';
import '@vaadin/vaadin-icons/vaadin-icons.js';
import '@polymer/iron-ajax/iron-ajax.js';
import '@polymer/iron-icon/iron-icon.js';

class WorkflowList extends List {
    
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
      
      <iron-ajax id="ajaxFiles" url="/api/workflow_list"  handle-as="json" last-response="{{data}}"></iron-ajax>
      
      <div class="card">
        <h1>Workflows</h1>
        <!-- Fetch an array of users to be shown in the grid -->
        
    
        <!-- The array is set as the <vaadin-grid>'s "items" property -->
        <vaadin-grid aria-label="Basic Binding Example" items="[[data]]">
    
  
          <vaadin-grid-column>
            <template class="header">Name</template>
            <template>[[item.name]]</template>
          </vaadin-grid-column>

          <vaadin-grid-column>
            <!-- type = Integration, Transformation (an ECL Job), Report (a Node JS job), Human Interaction (Approval)  -->
            <template class="header">Type</template>
            <template>[[item.type]]</template>
          </vaadin-grid-column>

          <vaadin-grid-column>
            <template class="header">Schedule</template>
            <template>[[item.schedule]]</template>
          </vaadin-grid-column>

          <vaadin-grid-column>
            <template class="header">Is Active</template>
            <template>[[item.isActive]]</template>
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
 
      <file-detail id="detail"> </file-detail>
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

window.customElements.define('workflow-list', WorkflowList);