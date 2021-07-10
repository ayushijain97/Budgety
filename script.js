drag = function (ev) {
  // console.log("Dragging ....", ev);
  ev.dataTransfer.setData("text", ev.target.id);
};
allowDrop = function (event) {
  // console.log("Allowing drop ....", event);
  event.preventDefault();
};
dropInsideIncome = function (ev) {
  console.log("Inside Income");
  var splitID, type, ID, deletedItem;
  console.log("Dropping drop ....", ev);
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  if (data) {
    //inc-1;
    splitID = data.split("-");
    type = splitID[0];
    ID = parseInt(splitID[1]);
    deletedItem = budgetController.deleteItem(type, ID);

    //deletedItem ID, type, description
    // budgetController.addItem();
    console.log(deletedItem.value);
    newItemGenerated = budgetController.addItem(
      "inc",
      deletedItem.description,
      deletedItem.value
    );

    // Removing the dragged item from Income box
    document.getElementById(data).remove();

    UIController.addListItem(newItemGenerated, "inc");

    // localStorage.setItem("Data", JSON.stringify(newItemGenerated));

    // 1. calculate the budget
    budgetController.calculateBudget();

    // 2. Return the budget
    var budget = budgetController.getBudget();

    // 3.Display the budget on the UI.
    UIController.displayBudget(budget);

    console.log(data);
  }
};

dropInsideExpense = function (ev) {
  console.log("Inside Expense");

  var splitID, type, ID, deletedItem;
  console.log("Dropping drop ....", ev);
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  if (data) {
    //inc-1;
    splitID = data.split("-");
    type = splitID[0];
    ID = parseInt(splitID[1]);
    deletedItem = budgetController.deleteItem(type, ID);

    //deletedItem ID, type, description
    // budgetController.addItem();
    console.log(deletedItem.value);
    newItemGenerated = budgetController.addItem(
      "exp",
      deletedItem.description,
      deletedItem.value
    );

    // Removing the dragged item from Income box
    document.getElementById(data).remove();

    UIController.addListItem(newItemGenerated, "exp");
    // localStorage.setItem("Data", JSON.stringify(newItemGenerated));

    // 1. calculate the budget
    budgetController.calculateBudget();

    // 2. Return the budget
    var budget = budgetController.getBudget();

    // 3.Display the budget on the UI.
    UIController.displayBudget(budget);

    console.log(data);
  }
};

// Budget controller
var budgetController = (function () {
  var Expenses = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };
  Expenses.prototype.calcPercentage = function (totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };
  Expenses.prototype.getPercentage = function () {
    return this.percentage;
  };
  var Income = function (id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };
  var calculateTotal = function (type) {
    var sum = 0;
    data.allItems[type].forEach(function (cur) {
      sum = sum + cur.value;
    });
    data.totals[type] = sum;
  };
  var data = {
    allItems: {
      exp: [],
      inc: [],
    },
    totals: {
      exp: 0,
      inc: 0,
    },
    budget: 0,
    percentage: -1,
  };

  return {
    addItem: function (type, des, val) {
      var newItem, ID;

      //[1,2,3,4,5],next ID=6
      //[1,2,4,6,8],next ID=9
      //ID=lastID+1

      // //create the new ID
      // if (data.allItems[type].length > 0) {
      //   ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      // } else {
      //   ID = 0;
      // }
      totalLength = data.allItems[type].length;

      //create new item based on the type
      if (type === "exp") {
        newItem = new Expenses(type + "-" + totalLength, des, val);
      } else if (type === "inc") {
        newItem = new Income(type + "-" + totalLength, des, val);
      }

      //pushing the data into the array
      data.allItems[type].push(newItem);

      //return new item
      return newItem;
    },
    deleteItem: function (type, id) {
      var ids, index, values;
      ids = data.allItems[type].map(function (current) {
        return current.id;
      });
      index = ids.indexOf(type + "-" + id);
      if (index !== -1) {
        itemToBeDeleted = data.allItems[type][index];
        data.allItems[type].splice(index, 1);
        return itemToBeDeleted;
      }
      localStorage.setItem("Data", JSON.stringify(data));
    },
    calculateBudget: function () {
      //calculate total income and expenses
      calculateTotal("inc");
      calculateTotal("exp");

      // calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      //calculate the percentage of the income that we spent
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
      localStorage.setItem("Data", JSON.stringify(data));
    },
    calculatePercentage: function () {
      data.allItems.exp.forEach(function (cur) {
        cur.calcPercentage(data.totals.inc);
      });
      localStorage.setItem("Data", JSON.stringify(data));
    },
    getPercentage: function () {
      var allPerc = data.allItems.exp.map(function (cur) {
        return cur.getPercentage();
      });
      return allPerc;
    },
    getBudget: function () {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage,
      };
    },
    testing: function () {
      console.log(data);
    },
  };
})();

// UI controller
var UIController = (function () {
  var DOMstrings = {
    inputtype: ".add__type",
    inputdescription: ".add__description",
    inputvalue: ".add__value",
    inputBtn: ".add__btn",
    incomeContainer: ".income__list",
    expenseContainer: ".expenses__list",
    budgetLabel: ".budget__value",
    incomeLabel: ".budget__income--value",
    expenseLabel: ".budget__expenses--value",
    percentageLabel: ".budget__expenses--percentage",
    container: ".container",
    expensesPercLabel: ".item__percentage",
    resetBtn: ".btn",
    month: ".budget__title--month",
  };

  /*

        Formatting the data(we are using private function as 
          we dont need this function from any other object or function)

    */
  var formatNumber = function (num, type) {
    var numSplit, int, dec;
    /*
              + or - before number
              exactly two decimal point
              comma seperating the thousands
    
              2314.2468  ->    + 2,314.24
              
           */
    num = Math.abs(num);
    num = num.toFixed(2);
    numSplit = num.split(".");
    int = numSplit[0];
    if (int.length > 3) {
      int =
        int.substr(0, int.length - 3) +
        "," +
        int.substr(int.length - 3, int.length);
    }
    dec = numSplit[1];

    return (type === "exp" ? "-" : "+") + " " + int + "." + dec;
  };
  var nodeListForEach = function (list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getinput: function () {
      return {
        type: document.querySelector(DOMstrings.inputtype).value, //will either inc or exp
        description: document.querySelector(DOMstrings.inputdescription).value,
        value: parseFloat(document.querySelector(DOMstrings.inputvalue).value),
      };
    },
    addListItem: function (obj, type) {
      var html, newHtml, element;

      // create html string with placeholder text
      if (type === "inc") {
        element = DOMstrings.incomeContainer;
        html = `
        <div class="item clearfix" id="%id%" draggable="true" ondragstart="drag(event)">
              <div class="item__description">%description%</div>
                <div class="right clearfix"><div class="item__value">%value%</div>
                <div class="item__delete">
                  <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                </div>
          </div>
        </div>
        `;
      } else if (type === "exp") {
        element = DOMstrings.expenseContainer;
        html = `
          <div class="item clearfix" id="%id%" draggable="true" ondragstart="drag(event)">
            <div class="item__description">%description%</div>
            <div class="right clearfix">
              <div class="item__value">%value%</div>
              <div class="item__percentage">21%</div>
              <div class="item__delete">
                <button class="item__delete--btn">
                  <i class="ion-ios-close-outline"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }

      // Replace the placeholder text with some actual data
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%description%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value, type));

      //Insert the html into the DOM
      document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);
    },
    deleteListItems: function (selectorID) {
      var el = document.getElementById(selectorID);
      el.parentNode.removeChild(el);
    },
    clearFields: function () {
      var fields, fieldArr;
      fields = document.querySelectorAll(
        DOMstrings.inputdescription + ", " + DOMstrings.inputvalue
      );

      fieldArr = Array.prototype.slice.call(fields);

      fieldArr.forEach(function (current, index, array) {
        current.value = "";
      });

      fieldArr[0].focus();
    },
    displayBudget: function (obj) {
      var type;
      obj.budget > 0 ? (type = "inc") : (type = "exp");

      document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(
        obj.budget,
        type
      );
      document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(
        obj.totalInc,
        "inc"
      );
      document.querySelector(DOMstrings.expenseLabel).textContent =
        formatNumber(obj.totalExp, "exp");
      if (obj.percentage > 0) {
        document.querySelector(DOMstrings.percentageLabel).textContent =
          obj.percentage + "%";
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = "---";
      }
    },
    displayPercentage: function (percentages) {
      var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

      nodeListForEach(fields, function (current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + "%";
        } else {
          current.textContent = "---";
        }
      });
    },

    /*
   
      Adding Month


  */
    displayMonth: function () {
      var month, now, year, months;
      now = new Date();
      months = [
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
      month = now.getMonth();
      year = now.getFullYear();
      document.querySelector(DOMstrings.month).textContent =
        months[month] + " " + year;
    },
    /*
          
          changed the color of border of input typw when we change the input type
    */

    changedType: function () {
      var fields = document.querySelectorAll(
        DOMstrings.inputtype +
          "," +
          DOMstrings.inputdescription +
          "," +
          DOMstrings.inputvalue
      );

      nodeListForEach(fields, function (cur) {
        cur.classList.toggle("red-focus");
      });
      document.querySelector(DOMstrings.inputBtn).classList.toggle("red");
    },

    getDOMstrings: function () {
      return DOMstrings;
    },
  };
})();
//Global App Controller
var controller = (function (budgetCtrl, UICtrl) {
  var setupEventListeners = function () {
    var DOM = UICtrl.getDOMstrings();
    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);
    document.addEventListener("keypress", function (event) {
      if (event.which === 13 || event.keyCode === 13) {
        ctrlAddItem();
      }
    });
    document
      .querySelector(DOM.container)
      .addEventListener("click", ctrlDeleteItem);
    document
      .querySelector(DOM.resetBtn)
      .addEventListener("click", clearStorage);
    document
      .querySelector(DOM.inputtype)
      .addEventListener("change", UICtrl.changedType);
  };
  /*

    Update Budget

 */
  var updateBudget = function () {
    // 1. calculate the budget
    budgetCtrl.calculateBudget();

    // 2. Return the budget
    var budget = budgetCtrl.getBudget();

    // 3.Display the budget on the UI.
    UICtrl.displayBudget(budget);
  };

  /*

  Update Percentage

  */

  var updatePercentages = function () {
    // 1.calculate percentages
    budgetController.calculatePercentage();
    // 2.Read percentages from the budget controller
    var percentages = budgetController.getPercentage();
    // 3.update the UI with the new percentages
    UICtrl.displayPercentage(percentages);
  };

  /*

  Adding items

  */

  var ctrlAddItem = function () {
    var input, newItem;
    // 1. Get input values.
    input = UICtrl.getinput();

    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // 2. Add the item to the budget controller.
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // 3. Add the new item to UI
      UICtrl.addListItem(newItem, input.type);

      //4.clear the fields
      UICtrl.clearFields();

      //5. Calculate and Update Budget
      updateBudget();

      //6. Calculate and Update Percentages
      updatePercentages();
    }
  };

  /*
   
      Delete Items


  */

  var ctrlDeleteItem = function (event) {
    var itemID, splitID, type, ID;
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
    if (itemID) {
      //inc-1;
      splitID = itemID.split("-");
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. Delete the item from the data structure
      budgetCtrl.deleteItem(type, ID);

      // 2. Delete the item from the UI
      UICtrl.deleteListItems(itemID);

      // 3. update and show the new budget
      updateBudget();

      //4. Calculate and Update Percentages
      updatePercentages();
    }
  };

  /*
   
      Reset Storage


  */
  var clearStorage = function (event) {
    // localStorage.clear();
    UICtrl.displayBudget({
      budget: 0,
      totalInc: 0,
      totalExp: 0,
      percentage: -1,
    });
    var type, splitID, ID, input, input1;
    var localData = JSON.parse(localStorage.getItem("Data"));
    input = localData.allItems.inc;
    input1 = localData.allItems.exp;
    // income
    input.forEach(function (cur) {
      if (cur.id) {
        //inc-1;
        splitID = cur.id.split("-");
        type = splitID[0];
        ID = parseInt(splitID[1]);

        // 1. Delete the item from the data structure
        budgetCtrl.deleteItem(type, ID);

        // 2. Delete the item from the UI
        UICtrl.deleteListItems(cur.id);
      }
    });
    // expenditure

    input1.forEach(function (cur) {
      if (cur.id) {
        //inc-1;
        splitID = cur.id.split("-");
        type = splitID[0];
        ID = parseInt(splitID[1]);

        // 1. Delete the item from the data structure
        budgetCtrl.deleteItem(type, ID);

        // 2. Delete the item from the UI
        UICtrl.deleteListItems(cur.id);
      }
    });
    localStorage.clear();
  };

  return {
    init: function () {
      console.log("Application has started");
      /*

          updating the data that exist in local storage and display it on screen

      */
      if (localStorage.length !== 0) {
        var localData = JSON.parse(localStorage.getItem("Data"));
        UICtrl.displayBudget({
          budget: localData.budget,
          totalInc: localData.totals.inc,
          totalExp: localData.totals.exp,
          percentage: localData.percentage,
        });

        var input, newItem;
        // 1. Get input values for income
        input = localData.allItems.inc;
        input1 = localData.allItems.exp;
        input.forEach(function (cur) {
          if (cur.description !== "" && !isNaN(cur.value) && cur.value > 0) {
            // 2. Add the item to the budget controller.
            newItem = budgetCtrl.addItem("inc", cur.description, cur.value);

            // 3. Add the new item to UI
            UICtrl.addListItem(newItem, "inc");
          }
        });

        input1.forEach(function (cur) {
          if (cur.description !== "" && !isNaN(cur.value) && cur.value > 0) {
            // 2. Add the item to the budget controller.
            newItem = budgetCtrl.addItem("exp", cur.description, cur.value);

            // 3. Add the new item to UI
            UICtrl.addListItem(newItem, "exp");
          }
        });
      } else {
        UICtrl.displayBudget({
          budget: 0,
          totalInc: 0,
          totalExp: 0,
          percentage: -1,
        });
      }

      /*

           Adding the month whenever we start or restart our website

      */

      UIController.displayMonth();

      setupEventListeners();
    },
  };
})(budgetController, UIController);

controller.init();
