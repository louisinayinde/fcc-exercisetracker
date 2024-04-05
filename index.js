const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}

// Mongoose Set Up
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

// User
const userSchema = new Schema({
  username: { type: String, required: true }
})
let userModel = mongoose.model("user", userSchema);

// Exercise
const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: new Date() }
})
let exerciseModel = mongoose.model("exercise", exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use("/", bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let newUser = new userModel({ username: username });
  newUser.save();
  res.json(newUser);
})

app.get('/api/users', (req, res) => {
  userModel.find({}).then((users) => {
    res.json(users);
  })
})

app.post('/api/users/:_id/exercises', (req, res) => {
  console.log(req.body);


  let userId = req.params._id;
  
  exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration
  }

  // If there is a date add it to the object
  if (req.body.date != ''){
    exerciseObj.date = req.body.date
  }

  let newExercise = new exerciseModel(exerciseObj);

  try{

  }catch{

  }

try {
    // Tente de trouver l'utilisateur par son ID
    const userFound = userModel.findById(userId);
    if (!userFound) {
      // Gérer le cas où l'utilisateur n'est pas trouvé
      console.log("User not found");
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Si l'utilisateur est trouvé, sauvegarder l'exercice
    newExercise.save();

    // Envoyer une réponse JSON avec les informations pertinentes
    res.json({
      _id: userFound._id,
      username: userFound.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: new Date(newExercise.date).toDateString()
    });
  } catch (err) {
    // Gérer les erreurs éventuelles lors de la recherche ou de la sauvegarde
    console.error(err);
    res.status(500).json({ error: "An error occurred" });
  }
})

app.get('/api/users/:_id/logs', (req, res) => {

  let fromParam = req.query.from;
  let toParam = req.query.to;
  let limitParam = req.query.limit;  
  let userId = req.params._id;

  // If limit param exists set it to an integer
  limitParam = limitParam ? parseInt(limitParam): limitParam

  try {
    const userFound = userModel.findById(userId);
    console.log(userFound);

    let queryObj = {
      userId: userId
    };

    if (fromParam || toParam) {
      queryObj.date = {};
      if (fromParam) {
        queryObj.date['$gte'] = fromParam;
      }
      if (toParam) {
        queryObj.date['$lte'] = toParam;
      }
    }

    // Utilisez await avec exec() et supprimez le callback
    let exercises = exerciseModel.find(queryObj).limit(limitParam).exec();
    let resObj

    if (Array.isArray(exercises)) {
      resObj = {
        _id: userFound._id,
        username: userFound.username,
        log: exercises.map(x => ({
          description: x.description,
          duration: x.duration,
          date: new Date(x.date).toDateString()
        })),
        count: exercises.length
      };
    } else {
      // Gérer le cas où exercises n'est pas un tableau
      resObj = {
        _id: userFound._id,
        username: userFound.username,
        log: exercises,
        count: exercises.length
      };
    }

    // Ici, vous devez retourner resObj ou le gérer comme nécessaire
    // Par exemple, vous pouvez le retourner si cette fonction est appelée ailleurs
    return resObj;

  } catch (err) {
    console.log(err);
    // Gérez l'erreur comme nécessaire, par exemple, en retournant un message d'erreur
    // Ou en lançant à nouveau l'erreur selon le contexte d'utilisation
    throw err; // ou return { error: "Un problème est survenu" };
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
