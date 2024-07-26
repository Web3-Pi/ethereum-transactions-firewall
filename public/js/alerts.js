import {alert_timeout} from "./config.js";

const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
var alert_num = 0;

export const appendAlert = (message, type) => {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible show fade" role="alert">`,
        `   <div>${message}</div>`,
        `   <button id="alert-id-${alert_num}" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`,
        '</div>'
    ].join('')

    alertPlaceholder.append(wrapper);

    const alert_id = `alert-id-${alert_num}`;
    setTimeout(function () {
        $(`#${alert_id}`).click();
    }, alert_timeout);

    alert_num += 1;
}
