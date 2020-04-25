//jshint esversion:6
//mongoose initialization
const mongoose = require("mongoose")
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const _ = require('lodash');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//connect mongoose
mongoose.connect("mongodb+srv://<adminname>:<password>@todolist-xlihg.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });


//schema creation . This was created for making default items
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
  }
})
//create mongoose.model
const Item = mongoose.model("Item", itemsSchema)


/* above is for setups below is for initialization and functions */

// creating default items
const baloon = new Item({
  name: "Baloon"
})
const ball = new Item({
  name: "Ball"
})
const cup = new Item({
  name: "Cup"
})

//defaultItems will store the above 3 items into array.
const defaultItems = [baloon, ball, cup];
const workItems = [];

/**
 * creating and modelling list schema
 * This is for below app.get condition 
 * when the custom path does not exits, it will create list 
 */
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);



/*
1. when "/" is app.get , it will trigger Item.find 
2. Item.find will trigger if statement to see if we have anything in the item array
3. if it is empty, then it will insert the pre-defined variable default items ( above stored )
4. Then it will redirect with res.redirect to read the code from the top again
5. In the second round, it will ignore the first if statement as we have more than 1 items
6. then it will render the res.render = items will show up
*/

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems,
        function (err) {
          if (err) {
            console.log(err)
          } else {
            console.log("Successfully saved default items")
          }
        }
      )
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

/**
 * This app.post functions to add new item in the todolist
 * 1. initialize itemName with req.body.newItem (newItem is form name in list.ejs)
 * 2. initialize listName with req.body.list This will return value listTitle which is the title of the list
 * 3. initialize model to add item with  list
 * 3. if the listName is Today ( the route ) it will just add the item and return to home route
 * 4. else, it will find the Lits with findOne .
 * 5. name:listName will return the list name
 * 6. if no error, it will push the item to the list and save.
 * 7. then it will redirect to the list name concat
 **/

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName)
    })
  }
});

/**
 * This app.post for /delete is to delete item from the todolist
 * 1. The delete action is based on check box clicked
 * 2. when clicked, the onChange function will trigger to submit the action (substitute of submit button )
 * 3.The checkbox has the added value variable of item:_id , so when clicked, it will return the item id value
 * 4. the hidden input will add the value of listTitle ( customname title )
 * 5. listTitle will be assigned to listName
 * 6. if condition will check if the listTitle is today
 * 7. If yes, then it will delete item based on deletingItem variabl which has the item.id
 * 8. If not, it will call findOneAndUpdate.
 * 9. This function will find the liste name and pull (delete) the deletingItem and redirect to the list
 */

app.post("/delete", function (req, res) {
  const deletingItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(deletingItem, function (err) {
      if (!err) {
        console.log("Successfully Deleted the Item")
      } res.redirect('/')
    })
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: deletingItem } } }, function (err, foundList) {
      if (!err) {
        res.redirect('/' + listName)
      }
    })
  }

})

/**
 * This app.get is when you add any random paramter after route 
 * 1. const customListName will store the param that user typed after /
 * 2. findOne will search customListName to check if user has ever typed this value
 * 3. if it is new , then it will create new List with customListName and defaultItems
 * 4. else, it will render the custom page  list.ejs 
 * 5. listTitle = foundList.name will render the customListName 
 */

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect('/' + customListName)
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    }
  })
});

app.get("/about", function (req, res) {
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function () {
  console.log("Server started");
});
