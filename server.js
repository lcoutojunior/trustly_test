const https = require('https');

function accessRepository(options) {
  return new Promise(
    function (resolve, reject) {
      console.log("Requesting to:", options);
      let data = '';

      https.get(options, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });

      }).on("error", (err) => {
        reject(err);
      });
    });
}

function getTreeListId(data){
  const regex = /\/tree-list\/[aA0-zZ9]*/ig;
  let m;

  while ((m = regex.exec(data)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
          regex.lastIndex++;
      }
      
      return(m[0].replace('/tree-list/',''));
  }
}

function getFileInfos(file, path){
  return new Promise(
    function (resolve, reject) {

      let name, lines, size, extension;

      const regex = /<div class="text-mono f6 flex-auto pr-3 flex-order-2 flex-md-order-1 mt-2 mt-md-0">[\n\s]*([0-9]*\slines)[\s\([aA-zZ0-9\)]*]*<span class="file-info-divider"><\/span>[\s\n]*([0-9\.]*\s[aA-zZ]*)/m;
      let m;
      if ((m = regex.exec(file)) !== null) {
        lines = m[1]
        size = m[2];
      }

      const regex2 = /\.(.+\/)*(.+)\.(.+)/mg;
      let m2;
      while ((m2 = regex2.exec(path)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        name = m2[2];
        extension = m2[3];
      }

      resolve ({name, lines, size, extension});

  });
  
}

async function mainFunction() {

  if (process.argv.length != 3) {
    console.log("Wrong Parameters\nUsage: node server.js [repository_name]\nExample: node server.js TheAlgorithms/Java");
    process.exit(0);
  }

  let hostname = 'github.com';
  let repositoryName = process.argv[2];

  let data = await accessRepository('https://'+hostname+'/'+repositoryName+'/find/master');
  let treeListId = getTreeListId(data);

  //console.log(treeListId);

  let options = {
    'method': 'GET',
    'hostname': hostname,
    'path': '/'+repositoryName+'/tree-list/'+treeListId,
    'headers': {
      'X-Requested-With': 'XMLHttpRequest'
    },
  };
   
  let treeList = await accessRepository(options);
  let treeListJson = JSON.parse(treeList);

  //.github/workflows/update_directory_md.yml
  // console.log(treeListJson.paths[1]); 
  // let file = await accessRepository('https://'+hostname+'/'+repositoryName+'/blob/master/'+treeListJson.paths[1]);
  // let fileInfo = getFileInfos(file, 'https://'+hostname+'/'+repositoryName+'/blob/master/'+treeListJson.paths[1]);
  // console.log(fileInfo);

  treeListJson.paths.forEach( async (file) =>{
    let data = await accessRepository('https://'+hostname+'/'+repositoryName+'/blob/master/'+file);
    let fileInfo = await getFileInfos(data, 'https://'+hostname+'/'+repositoryName+'/blob/master/'+file);
    console.log(fileInfo);
  });

}

mainFunction();
