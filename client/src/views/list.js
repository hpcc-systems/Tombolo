import {PolymerElement} from '@polymer/polymer';
import '../styles/shared-styles.js';

export class List extends PolymerElement { 

    constructor () {
        super();
        this.active = false;
    }
  
    static get properties() {
        return {
            active: {
                type: Boolean,
                observer: 'activeChanged'
            }
        }; 
    }

    ready() {
        super.ready();
    }

    activeChanged() {
        //Do nothing. This is supposed to be implemented by the inherited classes
    }
}
