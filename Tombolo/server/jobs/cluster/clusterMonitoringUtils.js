const clusterAccountNotificationPayload = () =>{
    return {
        title: 'Cluster Account Notification',
        message: 'Cluster account is running low on funds. Please top up to avoid disruption in service.',
        type: 'warning'
    }
}

module.exports = {
    clusterAccountNotificationPayload
}