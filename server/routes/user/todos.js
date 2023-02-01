

// Cluster Monitoring -
const clusterMonitoring = {
  id,
  name,
  app_id,
  cluster_id,
  Cron,
  isActive: false,
  metaData: {
    lastMonitored: "",
    Engine: [
      {
        name: "",
        notifyCondition: [{ maxSize: "", minSize: "" }],
        notificationChannel: [
          { type: "email", recipients: [] },
          { type: "teams", recipients: [] },
        ],
        notifiedVia: [],
      },
    ],
  },
};



// ====== Front end ======
// FORM 
// Select cluster
// Select Engine
// Monitoring Named
// Notification Condition -> [Max limit %]
// Max limit -> [%]
// Start Monitoring Now [checkbox]
// Notification Channel [Email , Ms Teams]
// Table to display all monitoring


// ====== Backend routes ============
// Create Cluster monitoring - DONE
// Get cluster monitoring [all] - Done
// Get Cluster monitoring [one] - Done
// Edit Cluster monitoring [ Pause/start monitoring ] - Done
// Delete monitoring - DONE

// ======= Back end works ==========
// Create Modal - DONE 
// Create Migration - DONE
// Create Bree Job - Done
// Notification template

// ======== Bree job - Logic =======
// If it finds monitoring -> make call to HPCC
// Check if any  notification condition are met
// If condition Met -> Check notification Channel 
// Build notification
// Send Notification
// Record in notification table


// ========= Other to dos ================
//Change fileMonitoring_notifications to just notifications
// Metadata no checked by express validator
// Move monitoring route so it requires auth after tests
// Enforce name uniqueness on database level


const response = {
    "GetTargetClusterUsageResponse": {
        "TargetClusterUsages": {
            "TargetClusterUsage": [
                {
                    "Name": "hthor",
                    "ComponentUsages": {
                        "ComponentUsage": [
                            {
                                "Type": "EclAgentProcess",
                                "Name": "myeclagent",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclagent",
                                                        "InUse": 16225464,
                                                        "Available": 14056328,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclagent",
                                                        "InUse": 16225472,
                                                        "Available": 14056320,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclSchedulerProcess",
                                "Name": "myeclscheduler",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclscheduler",
                                                        "InUse": 16225520,
                                                        "Available": 14056272,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclscheduler",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-data/eclscheduler not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                                                        "InUse": 16225528,
                                                        "Available": 14056264,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclCCServerProcess",
                                "Name": "myeclccserver",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclccserver",
                                                        "InUse": 16225508,
                                                        "Available": 14056284,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclserver",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-data/eclserver not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                                                        "InUse": 16225516,
                                                        "Available": 14056276,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "Name": "thor",
                    "ComponentUsages": {
                        "ComponentUsage": [
                            {
                                "Type": "ThorCluster",
                                "Name": "mythor",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/mythor",
                                                        "InUse": 16225412,
                                                        "Available": 14056380,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/thor",
                                                        "InUse": 16225416,
                                                        "Available": 14056376,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "mirror",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-mirror/thor",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-mirror/thor not found. Read disk usage from /var/lib/HPCCSystems/hpcc-mirror",
                                                        "InUse": 16225424,
                                                        "Available": 14056368,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclAgentProcess",
                                "Name": "myeclagent",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclagent",
                                                        "InUse": 16225464,
                                                        "Available": 14056328,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclagent",
                                                        "InUse": 16225472,
                                                        "Available": 14056320,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclSchedulerProcess",
                                "Name": "myeclscheduler",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclscheduler",
                                                        "InUse": 16225520,
                                                        "Available": 14056272,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclscheduler",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-data/eclscheduler not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                                                        "InUse": 16225528,
                                                        "Available": 14056264,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclCCServerProcess",
                                "Name": "myeclccserver",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclccserver",
                                                        "InUse": 16225508,
                                                        "Available": 14056284,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclserver",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-data/eclserver not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                                                        "InUse": 16225516,
                                                        "Available": 14056276,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "Name": "roxie",
                    "ComponentUsages": {
                        "ComponentUsage": [
                            {
                                "Type": "RoxieCluster",
                                "Name": "myroxie",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myroxie",
                                                        "InUse": 16225432,
                                                        "Available": 14056360,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/roxie",
                                                        "InUse": 16225436,
                                                        "Available": 14056356,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclSchedulerProcess",
                                "Name": "myeclscheduler",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclscheduler",
                                                        "InUse": 16225520,
                                                        "Available": 14056272,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclscheduler",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-data/eclscheduler not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                                                        "InUse": 16225528,
                                                        "Available": 14056264,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclCCServerProcess",
                                "Name": "myeclccserver",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclccserver",
                                                        "InUse": 16225508,
                                                        "Available": 14056284,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclserver",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-data/eclserver not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                                                        "InUse": 16225516,
                                                        "Available": 14056276,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "Name": "thor_roxie",
                    "ComponentUsages": {
                        "ComponentUsage": [
                            {
                                "Type": "ThorCluster",
                                "Name": "mythor",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/mythor",
                                                        "InUse": 16225412,
                                                        "Available": 14056380,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/thor",
                                                        "InUse": 16225416,
                                                        "Available": 14056376,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "mirror",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-mirror/thor",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-mirror/thor not found. Read disk usage from /var/lib/HPCCSystems/hpcc-mirror",
                                                        "InUse": 16225424,
                                                        "Available": 14056368,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclSchedulerProcess",
                                "Name": "myeclscheduler",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclscheduler",
                                                        "InUse": 16225520,
                                                        "Available": 14056272,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclscheduler",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-data/eclscheduler not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                                                        "InUse": 16225528,
                                                        "Available": 14056264,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "Type": "EclCCServerProcess",
                                "Name": "myeclccserver",
                                "MachineUsages": {
                                    "MachineUsage": [
                                        {
                                            "Name": "localhost",
                                            "NetAddress": ".",
                                            "DiskUsages": {
                                                "DiskUsage": [
                                                    {
                                                        "Name": "log",
                                                        "Path": "/var/log/HPCCSystems/myeclccserver",
                                                        "InUse": 16225508,
                                                        "Available": 14056284,
                                                        "PercentAvailable": 46
                                                    },
                                                    {
                                                        "Name": "data",
                                                        "Path": "/var/lib/HPCCSystems/hpcc-data/eclserver",
                                                        "Description": "/var/lib/HPCCSystems/hpcc-data/eclserver not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                                                        "InUse": 16225516,
                                                        "Available": 14056276,
                                                        "PercentAvailable": 46
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        },
        "UsageTime": "2023-01-31T18:54:53"
    }
}

const response2 = {
  GetTargetClusterUsageResponse: {
    TargetClusterUsages: {
      TargetClusterUsage: [
        {
          Name: "hthor",
          ComponentUsages: {
            ComponentUsage: [
              {
                Type: "EclAgentProcess",
                Name: "myeclagent",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/myeclagent",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/eclagent",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                Type: "EclSchedulerProcess",
                Name: "myeclscheduler",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/myeclscheduler",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/eclscheduler",
                            Description:
                              "/var/lib/HPCCSystems/hpcc-data/eclscheduler not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                Type: "EclCCServerProcess",
                Name: "myeclccserver",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/myeclccserver",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/eclserver",
                            Description:
                              "/var/lib/HPCCSystems/hpcc-data/eclserver not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          Name: "thor",
          ComponentUsages: {
            ComponentUsage: [
              {
                Type: "ThorCluster",
                Name: "mythor",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147002",
                      NetAddress: "10.173.147.2",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/mythor",
                            InUse: 1127886592,
                            Available: 2519781368,
                            PercentAvailable: 69,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/thor",
                            InUse: 1127886592,
                            Available: 2519781368,
                            PercentAvailable: 69,
                          },
                          {
                            Name: "mirror",
                            Path: "/var/lib/HPCCSystems/hpcc-mirror/thor",
                            InUse: 1127886592,
                            Available: 2519781368,
                            PercentAvailable: 69,
                          },
                        ],
                      },
                    },
                    {
                      Name: "node147003",
                      NetAddress: "10.173.147.3",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/mythor",
                            InUse: 1072782200,
                            Available: 2574885760,
                            PercentAvailable: 70,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/thor",
                            InUse: 1072782200,
                            Available: 2574885760,
                            PercentAvailable: 70,
                          },
                          {
                            Name: "mirror",
                            Path: "/var/lib/HPCCSystems/hpcc-mirror/thor",
                            InUse: 1072782200,
                            Available: 2574885760,
                            PercentAvailable: 70,
                          },
                        ],
                      },
                    },
                    {
                      Name: "node147004",
                      NetAddress: "10.173.147.4",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/mythor",
                            InUse: 1145479272,
                            Available: 2502188688,
                            PercentAvailable: 68,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/thor",
                            InUse: 1145479272,
                            Available: 2502188688,
                            PercentAvailable: 68,
                          },
                          {
                            Name: "mirror",
                            Path: "/var/lib/HPCCSystems/hpcc-mirror/thor",
                            InUse: 1145479272,
                            Available: 2502188688,
                            PercentAvailable: 68,
                          },
                        ],
                      },
                    },
                    {
                      Name: "node147005",
                      NetAddress: "10.173.147.5",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/mythor",
                            InUse: 1157091072,
                            Available: 2490576888,
                            PercentAvailable: 68,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/thor",
                            InUse: 1157091072,
                            Available: 2490576888,
                            PercentAvailable: 68,
                          },
                          {
                            Name: "mirror",
                            Path: "/var/lib/HPCCSystems/hpcc-mirror/thor",
                            InUse: 1157091072,
                            Available: 2490576888,
                            PercentAvailable: 68,
                          },
                        ],
                      },
                    },
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/mythor",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/thor",
                            Description:
                              "/var/lib/HPCCSystems/hpcc-data/thor not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "mirror",
                            Path: "/var/lib/HPCCSystems/hpcc-mirror/thor",
                            Description:
                              "/var/lib/HPCCSystems/hpcc-mirror/thor not found. Read disk usage from /var/lib/HPCCSystems/hpcc-mirror",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                Type: "EclAgentProcess",
                Name: "myeclagent",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/myeclagent",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/eclagent",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                Type: "EclSchedulerProcess",
                Name: "myeclscheduler",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/myeclscheduler",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/eclscheduler",
                            Description:
                              "/var/lib/HPCCSystems/hpcc-data/eclscheduler not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                Type: "EclCCServerProcess",
                Name: "myeclccserver",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/myeclccserver",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/eclserver",
                            Description:
                              "/var/lib/HPCCSystems/hpcc-data/eclserver not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          Name: "roxie",
          ComponentUsages: {
            ComponentUsage: [
              {
                Type: "RoxieCluster",
                Name: "roxie",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147006",
                      NetAddress: "10.173.147.6",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/roxie",
                            InUse: 84663804,
                            Available: 3563004156,
                            PercentAvailable: 97,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/roxie",
                            InUse: 84663804,
                            Available: 3563004156,
                            PercentAvailable: 97,
                          },
                        ],
                      },
                    },
                    {
                      Name: "node147007",
                      NetAddress: "10.173.147.7",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/roxie",
                            InUse: 84667884,
                            Available: 3563000076,
                            PercentAvailable: 97,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/roxie",
                            InUse: 84667884,
                            Available: 3563000076,
                            PercentAvailable: 97,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                Type: "EclSchedulerProcess",
                Name: "myeclscheduler",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/myeclscheduler",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/eclscheduler",
                            Description:
                              "/var/lib/HPCCSystems/hpcc-data/eclscheduler not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                Type: "EclCCServerProcess",
                Name: "myeclccserver",
                MachineUsages: {
                  MachineUsage: [
                    {
                      Name: "node147001",
                      NetAddress: "10.173.147.1",
                      DiskUsages: {
                        DiskUsage: [
                          {
                            Name: "log",
                            Path: "/var/log/HPCCSystems/myeclccserver",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                          {
                            Name: "data",
                            Path: "/var/lib/HPCCSystems/hpcc-data/eclserver",
                            Description:
                              "/var/lib/HPCCSystems/hpcc-data/eclserver not found. Read disk usage from /var/lib/HPCCSystems/hpcc-data",
                            InUse: 491431676,
                            Available: 3156236284,
                            PercentAvailable: 86,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
};