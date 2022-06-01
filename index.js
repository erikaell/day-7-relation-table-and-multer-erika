const express = require("express");
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');

const db = require('./connection/db');
const upload = require('./middlewares/uploadFile');
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');

const app = express();
const PORT = 6500;


app.set("view engine", "hbs"); //setup template engine / view engine

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'erikaelliyyin2108@gmail.com',
    pass: 'acsf ghjf zbak sudp'
  }
});


app.use("/public", express.static(__dirname + "/public"));
app.use('/uploads', express.static(__dirname + '/uploads'));

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

    let query = '';

    if (req.session.isLogin == true) {
      query = `SELECT tb_projects.*, tb_user.id as "user_id", tb_user.user_name, tb_user.email
      FROM tb_projects
      LEFT JOIN tb_user
      ON tb_projects.user_id = tb_user.id 
      WHERE tb_projects.user_id = ${req.session.user.id}
      ORDER BY tb_projects.id DESC`;
    } else {
      query = `SELECT tb_projects.*, tb_user.id as "user_id", tb_user.user_name, tb_user.email
      FROM tb_projects
      LEFT JOIN tb_user
      ON tb_projects.user_id = tb_user.id
      ORDER BY tb_projects.id DESC`;
    }

    client.query(query, function(err,result){
      if (err) throw err;

      const projectsData = result.rows;

      const newProject = projectsData.map((project)=>{
        project.duration = getDistanceTime(project.end_date,project.start_date);
        project.isLogin = req.session.isLogin;
        project.user_name = project.user_name ? project.user_name : '-';
        project.image = project.image
        ? '/uploads/' + project.image
        : '/public/assets/project-img.jpg';
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

app.post("/contact-me", (req, res) => {
  const data = req.body;

  let mailOptions = {
    from: 'erikaelliyyin2108@gmail.com',
    to: 'erikaelliyin21@gmail.com',
    subject: data["subject"],
    text: `Hi, my name is ${data["name"]}. ${data["subject"]}, ${data["message"]}. Let me hear from you soon, please contact me at ${data["email"]} or on ${data["phone"]}.`,
  };

  transporter.sendMail(mailOptions, function(e) {
    if (e) {
      console.log(e);
    }
    else {
      req.flash('success', 'Your message has been sent successfully.');
      res.redirect("/contact-me");
      console.log(r);
        }
    });
});


app.get("/add-project", (req, res) => {
  if (req.session.isLogin != true) {
    req.flash('warning', 'Please Login...');
    return res.redirect('/');
  }
  res.render("add-project", { isLogin: req.session.isLogin, user: req.session.user, });
});

app.post("/add-project", upload.single('image'), (req, res) => {
  const name = req.body.name;
  const start_date = req.body.startDate;
  const end_date = req.body.endDate;
  const description = req.body.description;
  const userId = req.session.user.id;
  const fileName = req.file.filename;
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

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `INSERT INTO tb_projects(name,start_date,end_date,description,technologies,image,user_id) VALUES('${name}','${start_date}','${end_date}','${description}', ARRAY ['${technologies[0]}','${technologies[1]}','${technologies[2]}','${technologies[3]}'],'${fileName}','${userId}');`;

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

app.get("/edit-project/:id", (req, res) => {
  const id = req.params.id;

  db.connect(function (err, client, done) {
    if (req.session.isLogin != true) {
      req.flash('warning', 'Please Login...');
      return res.redirect('/');
    }

    if (err) throw err;
    const query = `SELECT * FROM tb_projects WHERE id = ${id}`;

    client.query(query, function (err, result) {
      if (err) throw err;

      const project = result.rows[0];
      project.startdate = formattedTime(project.start_date);
      project.enddate = formattedTime(project.end_date);
      project.image = project.image
      ? '/uploads/' + project.image
      : '/public/assets/project-img.jpg';

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
    const query = `SELECT tb_projects.*, tb_user.id as "user_id", tb_user.user_name, tb_user.email
                  FROM tb_projects
                  LEFT JOIN tb_user
                  ON tb_projects.user_id = tb_user.id
                  WHERE tb_projects.id = ${id}`;

    client.query(query, function (err, result) {
      if (err) throw err;

      const project = result.rows[0];

      project.startDateNew = getFullTime(project.start_date);
      project.endDateNew = getFullTime(project.end_date);
      project.duration = getDistanceTime(project.end_date, project.start_date)
      project.image = project.image
      ? '/uploads/' + project.image
      : '/public/assets/project-img.jpg';

      res.render('detail-project', { project, isLogin: req.session.isLogin, user: req.session.user, });
    });

    done();
  });
});

app.post("/edit-project/:id", (req, res) => {
  id = req.params.id;
  const name = req.body.name;
  const start_date = req.body.startDate;
  const end_date = req.body.endDate;
  const description = req.body.description;
  const userId = req.session.user.id;
  const fileName = req.file.filename;
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

  db.connect(function (err, client, done) {
    if (err) throw err;

    const query = `UPDATE tb_projects SET name='${name}',start_date='${start_date}',end_date='${end_date}',description='${description}',technologies=ARRAY ['${technologies[0]}','${technologies[1]}','${technologies[2]}','${technologies[3]}'],image='${fileName}',user_id='${userId}' WHERE id='${id}';`;

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

    const query = `INSERT INTO tb_user(user_name,email,password) 
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
        name: data[0].user_name,
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

