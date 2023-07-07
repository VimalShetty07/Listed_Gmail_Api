const dotenv = require('dotenv').config({path:__dirname+"/config/config.env"});
const app = require('./app');


app.listen(process.env.PORT, () => {
  console.log(`Server is working on port ${process.env.PORT}`);
});


