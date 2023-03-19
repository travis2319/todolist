//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://travisdev:XhNbMDuVd!vf4-T@cluster0.bb4roea.mongodb.net/todolistDB", {
  useNewUrlParser: true
})

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "hello"
});

const item2 = new Item({
  name: "Travis"
});

const item3 = new Item({
  name: "dev"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  item: [itemSchema]
}

const List = mongoose.model("List", listSchema);

async function getItems() {
  const Items = await Item.find({});
  return Items;

}

app.get("/", function (req, res) {

  getItems().then(function (foundItem) {
    if (foundItem.length === 0) {
      Item.insertMany(defaultItems);
      console.log("successfully default element created to DB ");
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItem
      });
    }
  })
});

async function checkItems(customListName) {
  const item = await List.findOne({
    name: customListName
  });
  return item;
}

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list

  const item = new Item({
    name: itemName
  });
  if (listName === 'Today') {
    item.save();
    res.redirect("/");
  } else {
    checkItems(listName).then((foundList) => {
      foundList.item.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:customListName", function (req, res) {
  console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);

  checkItems(customListName).then(function (foundList) {

    if (!foundList) {

      var list = new List({
        name: customListName,
        items: defaultItems

      });
      list.save();
      res.redirect("/" + customListName);
      // console.log("not exist");
    } else {

      res.render("List", {
        listTitle: foundList.name,
        newListItems: foundList.item

      });
      // console.log("exist");
    }
  });
});



async function deleteItems(itemCheckedById) {

  const DeleteItems = await Item.findByIdAndRemove(itemCheckedById);
  return DeleteItems;
}

async function deleteCustomItem(listName, itemCheckedById) {
  const DeleteItems = await List.findOneAndUpdate({
    name: listName
  }, {
    $pull: {
      item: {
        _id: itemCheckedById
      }
    }
  });
  return DeleteItems;

}


app.post("/delete", function (req, res) {
  const itemCheckedById = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    deleteItems(itemCheckedById).then(function (deleted) {
      console.log("successfully deleted element from DB ");
    });

    res.redirect("/");
  } else {
    deleteCustomItem(listName, itemCheckedById).then(function () {
      res.redirect("/" + listName);
    })

  }


});

// app.get("/work", function (req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000 http://localhost:3000");
});