
// ** sanitize filename, check file is of correct type before passing to func below 

// PARAMETERS
// cluster -> Object containing cluster info [ eg: {thor_host, thor_port, username: 'admin' || '', password: 'password' || ''}]
// destinationFolder -> This is where you want your file end up [eg:  parentDir/ChildDir/ ]
// filePath -> Path to where the file is [eg:  uploads/stagedFile/]
// fileName -> Name of file [ eg : test.txt]
// machine -> Machine address [ eg: 10.173.147.1 || local host etc]

const upload = async (cluster, destinationFolder, filePath, machine) => {

  try {
    request(
      {
        url: `${cluster.thor_host}:${cluster.thor_port}/FileSpray/UploadFile.json?upload_&rawxml_=1&NetAddress=${machine}&OS=2&Path=${destinationFolder}`,
        method: "POST",
        auth: { username: cluster.username, password: cluster.password },
        formData: {
          "UploadedFiles[]": {
            value: fs.createReadStream(filePath),
            options: {
              filename: "Give new to file if you need",
            },
          },
        },
      },

      function (err, httpResponse, body) {
        const response = JSON.parse(body);
        if (err) {
          return console.log(err);
        }
        if (response.Exceptions) {
          console.log(response.Exceptions);
        } else {
          console.log("File upload successful");
        }

        fs.unlink(filePath, (err) => {
          if (err) {
            console.log("Failed to remove file from FS");
          }
        });
      }
    );
  } catch (err) {
    console.log(err);
  }
};
