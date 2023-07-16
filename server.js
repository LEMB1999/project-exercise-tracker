const express = require('express')
const uuid = require('uuid');
const fs = require('fs');
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


async function readJSON(filename) {
  let json = await fs.readFileSync(filename, { encoding: "utf-8" });
  return JSON.parse(json);
}

async function saveJSON(filename, json) {
  json = JSON.stringify(json);
  fs.writeFileSync(filename, json);
}

app.post("/api/users", async (req, res) => {

  const id = uuid.v4();
  const json = await readJSON("./users.json");
  const obj = {
    _id: id,
    username: req.body.username
  };
  json.users.push(obj);
  await saveJSON("./users.json", json);
  return res.status(200).json(obj);

});

app.get("/api/users", async (req, res) => {

  const json = await readJSON("./users.json");
  return res.status(200).json(
    json.users
  );

});

app.post("/api/users/:_id/exercises", async (req, res) => {

  const json = await readJSON("./logs.json")
  const { users } = await readJSON("./users.json")
  const date = req.body.date ? new Date(req.body.date) : new Date()

  const obj = {
    "_id": req.params._id,
    "username": users.find((element) => element._id == req.params._id)?.username,
    "description": req.body.description,
    "duration": Number(req.body.duration),
    "date": date
  }
  json.logs.push(obj)
  await saveJSON("./logs.json", json)
  return res.status(200).json({...obj,date:date.toDateString()})

});

/* response
{
  username: "fcc_test",
  count: 1,
  _id: "5fb5853f734231456ccb3b05",
  log: [{
    description: "test",
    duration: 60,
    date: "Mon Jan 01 1990",
  }]
}

*/
app.get("/api/users/:_id/logs", async (req, res) => {
  const json = await readJSON("./logs.json")
  const { users } = await readJSON("./users.json")

  //filter the logs
  let logs = json.logs.filter((element) => element._id == req.params._id)

  console.log("logs 1",logs)
  
  if (req.query.from) {
    console.log("from",req.query.from);
    let from = new Date(req.query.from);
    logs = logs.filter((element) => {
      
      return new Date(element.date) >= from
    })
  }

  if (req.query.to) {
    console.log("to ",req.query.to);
    let to = new Date(req.query.to);
    logs = logs.filter((element) => {
      return new Date(element.date) <= to
    })
  }

  if (req.query.limit) {
    console.log("limit ",req.query.limit);
    let limit =  Number(req.query.limit)
    if (logs.length > limit ) {
      logs = logs.slice(0, limit );
    }
  }

  console.log("logs 2",logs)
  
  const obj = {
    "username": users.find((element) => element._id == req.params._id).username,
    "count": logs.length,
    "_id": req.params._id,
    "log": logs.map((element) => {
        let date = new Date(element.date);
        return {"description": element.description, "duration": element.duration,     
                "date":  date.toDateString()}
        })
  }

  return res.status(200).json(obj);

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
