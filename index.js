const express = require("express");

const app = express();
const PORT = 8000;

// const isLogin = true;

app.set("view engine", "hbs"); //setup template engine / view engine

app.use("/public", express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

app.get("/contact-me", (req, res) => {
  res.render("contact-me");
});

app.get("/add-project", (req, res) => {
  res.render("add-project");
});

app.post("/contact-me", (req, res) => {
  const data = req.body;
  console.log(data);

  res.redirect("/contact-me");
});

app.post("/add-project", (req, res) => {
  const data = req.body;
  console.log(data);

  res.redirect("/add-project");
});

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
