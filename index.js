import express from "express";
import axios from "axios";
import { dirname } from "path";
import { URLSearchParams, fileURLToPath } from "url";
import morgan from "morgan";
import bodyParser from "body-parser";
import { JSDOM } from  "jsdom";
import jQuery from "jquery";
const { window } = new JSDOM("");
const { document } = new JSDOM("").window;
global.document = document;
const $ = jQuery( window );


const port = 3000;
const app = express();
const apiURL = "https://health.gov/myhealthfinder/api/v3";

app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
})

app.use(morgan("dev"));
app.use(express.urlencoded({extended:true}));
app.use(express.static(dirname(fileURLToPath(import.meta.url)) + "/public"));

app.get("/", (req, res) => {   
    res.render("index.ejs");
});

let userName;
let data;

async function getURL(url) {
  const response = await axios.get(url);
  const result = response.data;
  // console.log(result.Result.Resources.Resource[0].MyHFDescription);
  return result;
}

// const testData = await getURL("https://health.gov/myhealthfinder/api/v3/myhealthfinder.json?age=10&sex=male")
// console.log(testData)

// const testData = await getURL("https://health.gov/myhealthfinder/api/v3/topicsearch.json?lang=en&keyword=loved one");
// const result = testData.Result.Resources.Resource;
// result.forEach(element => {
//   console.log(element.Title);
//   console.log(element.Sections.section[0].Content)
// });

const categoriesData = await getURL("https://health.gov/myhealthfinder/api/v3/itemlist.json?lang=en&type=category");
const categories = categoriesData.Result.Items.Item
const categoriesArray = new Object();
categories.forEach(element => {
  const name = element.Title;
  const id = element.Id;
  if (categoriesArray.hasOwnProperty(name)) {
    var list = categoriesArray[name];
    list.push(id);
    categoriesArray[name] = list;
  } else {
    var list = [];
    list.push(id)
    categoriesArray[name] = list
  }
});

const categoriesList = Object.keys(categoriesArray);

const topicData = await getURL("https://health.gov/myhealthfinder/api/v3/itemlist.json?lang=en&type=topic");
const topics = topicData.Result.Items.Item;
const topicArray = new Object();
topics.forEach(element => {
  const name = element.Title;
  const id = element.Id;
  topicArray[name] = id;
});

const topicList = Object.keys(topicArray);

app.get("/getting-started", (req, res) => {
  res.render("user-info.ejs", {userName:userName, categories:categoriesList, topics:topicList});
})

app.post("/getting-started", (req, res) => {
  userName = req.body.userName;
  res.render("user-info.ejs", {userName:userName, categories:categoriesList, topics:topicList})
})

app.post("/user-topic", async (req, res) => {
  const topic = topicArray[req.body.topic];
  const params = new URLSearchParams({
    topicId:topic,
    categoryId:categoriesArray[req.body.category]
  })
  let keysForDel = [];
  params.forEach((value, key) => {
    if (value == 'undefined'){
      keysForDel.push(key)
    }
  });
  keysForDel.forEach(key => {
    params.delete(key);
  })
  const url = apiURL + "/topicsearch.json?" + params.toString();
  console.log(url);
  try {
    const response = await axios.get(url);
    const result = response.data.Result.Resources.Resource;
    res.render("user-info.ejs", {data:result, userName:userName, categories:categoriesList, topics:topicList});
  } catch (error) {
    res.render("user-info.ejs", {userName:userName, userName:userName, categories:categoriesList, topics:topicList, error:"No topics that match your criteria."})
  }
})


app.post("/user-keyword", async (req, res) => {
  const params = new URLSearchParams({
    keyword:req.body.keyword,
  })
  const url = apiURL + "/topicsearch.json?" + params.toString();
  try {
    const response = await axios.get(url);
    const result = response.data.Result.Resources.Resource;
    res.render("user-info.ejs", {data:result, userName:userName, categories:categoriesList, topics:topicList});
  } catch (error) {
    res.render("user-info.ejs", {userName:userName, error:"No topics that match your criteria."})
  }
})


