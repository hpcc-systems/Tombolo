module.exports = {
  clusters: [
    {
      name: "Play",
      thor: "https://play.hpccsystems.com",
      thor_port: "18010",
      roxie: "https://play.hpccsystems.com",
      roxie_port: "18002",
    },
    {
      name: "4-Way-2",
      thor: "http://10.173.147.1",
      thor_port: "8010",
      roxie: "http://10.173.147.1",
      roxie_port: "8002",
    },
    {
      name : "new",
      thor: "http://52.255.183.194",
      thor_port : "8010",
      roxie : "http://52.255.183.194",
      roxie_port: "8002"
    },
    {
      name: "4-Way",
      thor: "https://discoverylab.hpcc.risk.regn.net",
      thor_port: "18010",
      roxie: "https://discoverylab.hpcc.risk.regn.net",
      roxie_port: "18010",
    },
  ],
};
