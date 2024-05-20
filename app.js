const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

app.use(cors());  


app.use(express.json())

const dbPath = path.join(__dirname, 'app.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:9000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const jwt = require('jsonwebtoken')

function generateToken(user) {
  const payload = {
    name: user.name,
    password: user.password,
  }

  const token = jwt.sign(payload, 'your_secret_key', {expiresIn: '30'})
  return token
}

app.post('/signin/', async (request, response) => {
  const userdetails = request.body
  const {name, password} = userdetails

  const existingUser = await db.get(`SELECT * FROM user WHERE name = '${name}'`)
  if (existingUser) {
    return response.status(400).json({error: 'User already exists'})
  }

  const insertQuery = `INSERT INTO user(name, password) VALUES ('${name}', '${password}');`
  await db.run(insertQuery)

  response.status(201).json({message: 'User created successfully'})
})

app.post('/login/', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password are required' });
  }

  const query = `SELECT * FROM user WHERE name = ? AND password = ?`;
  const user = await db.get(query, [name, password]);

  if (user) {
    const jwtToken = generateToken(user);
    return res.json({ token: jwtToken });
  } else {
    return res.status(404).json({ error: 'User not found' });
  }
});

app.get('/', async (res, req) => {
  const data = `select * from user`
  const m = await db.all(data)
  req.send(m)
})
