const express = require("express");
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');

const db = require('./connection/db');

const app = express();
const PORT = 6500;

// const isLogin = true;

app.set("view engine", "hbs"); //setup template engine / view engine

// db.connect(function (err, _, done){
//   if (err) throw err;
//   console.log('Database Connection Success');
//   done();
// })

app.use("/public", express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: 'rahasia',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 2 },
  })
);

app.use(flash());

let projects = [];

app.get("/", (req, res) => {
  db.connect(function (err, client, done){
    if (err) throw err;

    const query = 'SELECT * FROM tb_projects';

    client.query(query, function(err,result){
      if (err) throw err;

      const projectsData = result.rows;

      const newProject = projectsData.map((project)=>{
        project.duration = getDistanceTime(project.end_date,project.start_date);
        project.isLogin = req.session.isLogin;
        return project;
      });

      console.log(newProject);

      res.render("index", { projects: newProject, isLogin: req.session.isLogin, user: req.session.user, });

    });
    done();
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

app.get("/contact-me", (req, res) => {
  res.render("contact-me", { isLogin: req.session.isLogin, user: req.session.user, });
});

app.get("/add-project", (req, res) => {
  res.render("add-project", { isLogin: req.session.isLogin, user: req.session.user, });
});

app.post("/contact-me", (req, res) => {
  const data = req.body;
  // console.log(data);

  res.redirect("/contact-me");
});

app.post("/add-project", (req, res) => {
  const name = req.body.name;
  const start_date = req.body.startDate;
  const end_date = req.body.endDate;
  const description = req.body.description;
  const technologies = [];
  if(req.body.html){
    technologies.push('html');
  } else {
    technologies.push('');
  }
  if(req.body.javascript){
    technologies.push('javascript');
  } else {
    technologies.push('');
  }
  if(req.body.css){
    technologies.push('css');
  } else {
    technologies.push('');
  }
  if(req.body.php){
    technologies.push('php');
  } else {
    technologies.push('');
  }
  const image = req.body.image;

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `INSERT INTO tb_projects(name,start_date,end_date,description,technologies,image) VALUES('${name}','${start_date}','${end_date}','${description}', ARRAY ['${technologies[0]}','${technologies[1]}','${technologies[2]}','${technologies[3]}'],'${image}');`;

    client.query(query, function (err, result) {
      if (err) throw err;

      res.redirect('/');
    });

    done();
  });
});

app.get("/delete-project/:id", (req, res) => {
  const id = req.params.id;

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `DELETE FROM tb_projects WHERE id = ${id};`;

    client.query(query, function (err, result) {
      if (err) throw err;

      res.redirect('/');
    });

    done();
  });
});

// app.get("/edit-project/:index", (req, res) => {
//   const index = req.params.index;
//   let project = projects[index];

//   res.render("edit-project", { data: index, project });
// });

app.get("/edit-project/:id", (req, res) => {
  const id = req.params.id;

  db.connect(function (err, client, done) {
    if (err) throw err;
    const query = `SELECT * FROM tb_projects WHERE id = ${id}`;

    client.query(query, function (err, result) {
      if (err) throw err;

      const project = result.rows[0];
      project.startdate = formattedTime(project.start_date);
      project.enddate = formattedTime(project.end_date);

      console.log(project);
      res.render('edit-project', { project, id, isLogin: req.session.isLogin, user: req.session.user, });
    });

    done();
  });
});

app.get("/detail-project/:id", (req, res) => {
  const id = req.params.id;

  db.connect(function (err, client, done) {
    if (err) throw err;
    const query = `SELECT * FROM tb_projects WHERE id = ${id}`;

    client.query(query, function (err, result) {
      if (err) throw err;

      const project = result.rows[0];

      project.startDateNew = getFullTime(project.start_date);
      project.endDateNew = getFullTime(project.end_date);
      project.duration = getDistanceTime(project.end_date, project.start_date)

      res.render('detail-project', { project, isLogin: req.session.isLogin, user: req.session.user, });
    });

    done();
  });
});

// app.post("/edit-project/:index", (req, res) => {
//   const data = req.body;

//   projects[req.params.index] = {
//     name: data["name"],
//     startDate: data["startDate"],
//     endDate: data["endDate"],
//     image: data["image"],
//     description: data["description"],
//     technologies: data["technologies"],
//     duration: getDistanceTime(data["endDate"], data["startDate"]),
//     startDateNew: getFullTime(data["startDate"]),
//     endDateNew: getFullTime(data["endDate"])
//   };

app.post("/edit-project/:id", (req, res) => {
  id = req.params.id;
  const name = req.body.name;
  const start_date = req.body.startDate;
  const end_date = req.body.endDate;
  const description = req.body.description;
  const technologies = [];
  if(req.body.html){
    technologies.push('html');
  } else {
    technologies.push('');
  }
  if(req.body.javascript){
    technologies.push('javascript');
  } else {
    technologies.push('');
  }
  if(req.body.css){
    technologies.push('css');
  } else {
    technologies.push('');
  }
  if(req.body.php){
    technologies.push('php');
  } else {
    technologies.push('');
  }
  const image = req.body.image;

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `UPDATE tb_projects SET name='${name}',start_date='${start_date}',end_date='${end_date}',description='${description}',technologies=ARRAY ['${technologies[0]}','${technologies[1]}','${technologies[2]}','${technologies[3]}'],image='${image}' WHERE id='${id}';`;

    client.query(query, function (err, result) {
      if (err) throw err;

      res.redirect('/');
    });

    done();
  });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  let password = req.body.password;

  password = bcrypt.hashSync(password, 10);

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `INSERT INTO tb_user(name,email,password) 
                    VALUES('${name}','${email}','${password}');`;

    client.query(query, function (err, result) {
      if (err) throw err;

      if (err) {
        res.redirect('/register');
      } else {
        res.redirect('/login');
      }
    });

    done();
  });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email == '' || password == '') {
    req.flash('warning', 'Please insert all fields');
    return res.redirect('/login');
  }

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `SELECT * FROM tb_user WHERE email = '${email}';`;

    client.query(query, function (err, result) {
      if (err) throw err;

      const data = result.rows;

      if (data.length == 0) {
        req.flash('error', 'Email not found');
        return res.redirect('/login');
      }

      const isMatch = bcrypt.compareSync(password, data[0].password);

      if (isMatch == false) {
        req.flash('error', 'Password not match');
        return res.redirect('/login');
      }

      req.session.isLogin = true;
      req.session.user = {
        id: data[0].id,
        email: data[0].email,
        name: data[0].name,
      };

      req.flash('success', `Welcome, <b>${data[0].email}</b>`);

      res.redirect('/');
    });

    done();
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const month = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getFullTime(time) {
  let newTime = new Date(time);
  const date = newTime.getDate();
  const monthIndex = newTime.getMonth();
  const year = newTime.getFullYear();

  const fullTime = `${date} ${month[monthIndex]} ${year}`;

  return fullTime;
}

function formattedTime(time) {
  let newTime = new Date(time);
  const date = newTime.getDate();
  const monthIndex = newTime.getMonth() + 1;
  const year = newTime.getFullYear();

  if(monthIndex<10){
    monthformat = '0' + monthIndex;
  } else {
    monthformat = monthIndex;
  }

  
  if(date<10){
    dateformat = '0' + date;
  } else {
    dateformat = date;
  }

  const fullTime = `${year}-${monthformat}-${dateformat}`;

  return fullTime;
}

function getDistanceTime(time1, time2) {
  const endDate = new Date(time1);
  const startDate = new Date(time2);

  const distance = endDate - startDate;

  const milisecondsInMonth = 1000 * 60 * 60 * 24 * 30;
  const distanceMonth = Math.floor(distance / milisecondsInMonth);

  if (distanceMonth >= 1) {
    return `${distanceMonth} month`;
  } else {
    const milisecondsInDay = 1000 * 60 * 60 * 24;
    const distanceDay = Math.floor(distance / milisecondsInDay);
    return `${distanceDay} day`;
  }
}

// app.get('/detail-blog/:index', (req, res) => {
//   const index = req.params.index;

//   res.render('blog-detail', { data: index, number: '2022' });
// });

// app.get('/contact', (req, res) => {
//   res.render('contact');
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port: ${PORT}`);
// });

// Backend = 5000 etc
// Frontend = 3000 etc
