export class Comm {

  // static getData(serviceName, serviceContent, respType, obj)  {
  //   return fetch('/api/'+serviceName, {
  //     method: 'get',
  //     headers: new Headers({
  //       'Content-Type': 'application/json'
  //     }),
  //     body: JSON.stringify({
  //       "content": serviceContent
  //     })
  //   }).then(function (response) {
  //     return response.json();
  //   }).then(function (data) {
  //     obj.receiveData(respType, data);
  //   }).catch(error => console.error(error));
  // }

  static getData(serviceName, serviceContent, respType, obj)  {
    return fetch('/api/'+serviceName, {
      method: 'get',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      obj.receiveData(respType, data);
    }).catch(error => console.error(error));
  }
  
}
