const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertstateObjectToResponseObject = stateObject => {
  return {
    stateId: stateObject.state_id,
    stateName: stateObject.state_name,
    population: stateObject.population,
  }
}

const convertDistrictObjectToResponseObject = districtObject => {
  return {
    districtId: districtObject.district_id,
    districtName: districtObject.district_name,
    stateId: districtObject.state_id,
    cases: districtObject.cases,
    cured: districtObject.cured,
    active: districtObject.active,
    deaths: districtObject.deaths,
  }
}

const convertDBObjectToResponseObject = dbObject => {
  return {
    totalCases: dbObject.totalCases,
    totalCured: dbObject.totalCured,
    totalActive: dbObject.totalActive,
    totalDeaths: dbObject.totalDeaths,
  }
}

const convertStateNameObjectToResponseObject = nameObject => {
  return {
    stateName: nameObject.state_name,
  }
}

// Get states API

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state
    ORDER BY 
    state_id;`

  const statesArray = await db.all(getStatesQuery)
  response.send(
    statesArray.map(eachState => convertstateObjectToResponseObject(eachState)),
  )
})

// Get state API

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT 
    * 
    FROM 
    state
    WHERE 
    state_id = ${stateId};`
  const resultState = await db.get(getStateQuery)
  response.send(convertstateObjectToResponseObject(resultState))
})

// Post District API

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
  VALUES
    ( "${districtName}", ${stateId}, ${cases}, ${cured}, ${active}, ${deaths} );`

  const addDistrict = await db.run(postDistrictQuery)
  response.send('District Successfully Added')
  console.log(addDistrict)
})

// Get district API

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT 
    * 
    FROM 
    district
    WHERE 
    district_id = ${districtId};`
  const resultDistrict = await db.get(getDistrictQuery)
  response.send(convertDistrictObjectToResponseObject(resultDistrict))
})

// Delete District API

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

// Put movie API

app.put('/districts/:districtId/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const {districtId} = request.params
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = "${districtName}",
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
  district_id = ${districtId};`

  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

// Get Statics of State API

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatesQuery = `
    SELECT 
     SUM(cases) AS totalCases, 
     SUM(cured) AS totalCured, 
     SUM(active) AS totalActive, 
     SUM(deaths) AS totalDeaths
    FROM 
    district
    WHERE 
    state_id = ${stateId};`
  const resultState = await db.all(getStatesQuery)
  const newState = resultState[0]
  const result = convertDBObjectToResponseObject(newState)
  response.send(result)
})

// Get Districtname API

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictNameQuery = `
    SELECT 
    state.state_name
    FROM 
    state INNER JOIN district ON state.state_id = district.state_id
    WHERE 
    district_id = ${districtId};`
  const resultStateName = await db.get(getDistrictNameQuery)
  response.send(convertStateNameObjectToResponseObject(resultStateName))
})

module.exports = app
