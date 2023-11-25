// 24-11-23 Changed CSS - create two variants of buttonBox class

var program = new Array();
var userInMiddleOfTypingNumber = false;
var isParenthesisNeededOnNextOperation = false;
var isPreviousOperationEqual = false;


function initializeCalculator() {
    var displayValue;
    var programDescriptionValue;
    //check offline storage. see if there's any data

    var serializedArray = window.localStorage.getItem("programArray");
    if (serializedArray != "[]" && serializedArray != undefined) 
    {
        program = JSON.parse(serializedArray);
        calculateAndUpdateDisplay();
        updateProgramDescription();
    }
    else
    {
        $("#display").val("0");
        $("#descriptionDisplay").val("");
    }

}

function numberButtonPressed(pressedButton)
{
    numberPressed(pressedButton.attr("data-value"));
    pressedButton.blur();

}

function numberPressed(pressedButtonValue) {

    if (isPreviousOperationEqual)
        allClearPressed();

    var currentDisplayValue = $("#display").val();

    //first update the display
    //if the user is typing an existing number, then concatenate
    //else erase the previous number from the display and start a new number
    if (userInMiddleOfTypingNumber) {
        if (pressedButtonValue != "." || currentDisplayValue.indexOf('.') == -1)
            //consider using jquery expression jQuery.inArray()
        {
            if ($("#display").val() == "0")
                $("#display").val(pressedButtonValue);
            else
                $("#display").val(currentDisplayValue + pressedButtonValue);
        }
    }
    else {
        if (pressedButtonValue == '.')
            $("#display").val('0.');
        else
            $("#display").val(pressedButtonValue);
        //maintain userInMiddleOfTypingNumber = true
        userInMiddleOfTypingNumber = true;
    }

    //ADDITIONAL WORK: add special case for users typing 0 on a clear screen.

}

function doBinaryOperation(operand1, operand2, operation) {
    var result;
    if (operation == "+")
        result = parseFloat(operand1) + parseFloat(operand2);
    else if (operation == "-")
        result = parseFloat(operand1) - parseFloat(operand2);
    else if (operation == "*")
        result = parseFloat(operand1) * parseFloat(operand2);
    else if (operation == "/")
    {
        result = parseFloat(operand1) / parseFloat(operand2);
        //NEED to handle division by zero
    }

    return result;

    //also consider using isNaN
    //BOOL isNaN(val);
}

function isBinaryOperator(operatorOrOperand)
{
    if ("+-*/".indexOf(operatorOrOperand) >= 0)
        return true;
    else 
        return false;
}

function updateLocalStorage()
{
    //serialize javascript array
    var serializedArray = JSON.stringify(program);

    //save to local storage
    window.localStorage.setItem('programArray', serializedArray);

}

function getCalcValueOffTopOfStack(stack) {

    var result = stack[0];
    stack.shift();
    if (stack[0])
        //check if there is an operator after our current operand
    {
        var operator = stack[0];
        stack.shift();
        if (stack[0])
            //check if there is one more operand
        {
            var operand2 = stack[0];
            stack.shift();
            if (isBinaryOperator(operator))
                //extra check to ensure binary operation
            {
                
                result = doBinaryOperation(result, operand2, operator);
                stack.unshift(result);
            }
        }
    }
    if (stack.length > 1)
        result = getCalcValueOffTopOfStack(stack);

    return result;

    //if (isBinaryOperator(operator))
    //        //case 1: there is a binary operator and a second operand
    //        //case 2: there is a binary operator but no second operand
    //        //case 3: there's nothing else
    //        //error case: there's just another number?


}

function getDisplayOffTopOfStack(stack) {

    var result = stack[0];
    stack.shift();
    if (stack[0])
        //check if there is an operator after our current operand
    {
        var operator = stack[0];

        //if the previous operation was of type + or -, and if this operation is * or /, then apply the brackets on the result
        if (isParenthesisNeededOnNextOperation && (operator == "*" || operator == "/"))
        {
            result = "(" + result + ")" + operator;
            isParenthesisNeededOnNextOperation = false;
        }
        else
            result += operator;

        if (operator == "+" || operator == "-")
            isParenthesisNeededOnNextOperation = true;
        stack.shift();
        if (stack[0])
            //check if there is one more operand
        {
            var operand2 = stack[0];
            result += operand2;
            stack.shift();
            stack.unshift(result);
        }
    }
    if (stack.length > 1)
        result = getDisplayOffTopOfStack(stack);

    return result;
}

function calculateAndUpdateDisplay() {
    var result = getCalcValueOffTopOfStack(program.slice(0));
    result = result.toString();
    if (result.indexOf('.') != -1) {
        result = result.substr(0, result.indexOf('.')+6);
    }

    $("#display").val(result);
}

function updateProgramDescription() {
    //need a global to manage showing/hiding of brackets
    isParenthesisNeededOnNextOperation = false;

    $("#descriptionDisplay").val(getDisplayOffTopOfStack(program.slice(0)));
}

function equalPressed() {
    if (userInMiddleOfTypingNumber)
    {
        userInMiddleOfTypingNumber = false;
        program.push($("#display").val());
        updateLocalStorage();
    }
    isPreviousOperationEqual = true;
    calculateAndUpdateDisplay();
    //update programdescription
    updateProgramDescription();

}

function operationButtonPressed(pressedButton)
{
    operationPressed(pressedButton.attr("data-value"));
    pressedButton.blur();
}

function operationPressed(pressedOperation) {

    isPreviousOperationEqual = false;
    //we want to allow a scenario where user types 1+1=, and then hits + again. 

    if (userInMiddleOfTypingNumber) {
        //user is no longer in the middle of typing a number
        userInMiddleOfTypingNumber = false;
        program.push($("#display").val());
        //add the operation to the stack
        program.push(pressedOperation);
        updateLocalStorage();
        //update display, performing prior existing calculation as necessary
        calculateAndUpdateDisplay();
        //update programdescription

    }
    else {
        //check if the last item pushed was a binary operator
        //if so replace it
        if (program.length == 0)
            return;

        if (isBinaryOperator(program[program.length - 1]))
            program[program.length - 1] = pressedOperation;
        else
        {
            program.push(pressedOperation);
            updateLocalStorage();
        }

    }

    updateProgramDescription();


}

function clearPressed() {
    //reset display to zero. 
    //do not change the rest of the program
    $("#display").val("0");
    userInMiddleOfTypingNumber = false;
}

function allClearPressed() {
    program = new Array();
    userInMiddleOfTypingNumber = false;
    isParenthesisNeededOnNextOperation = false;
    isPreviousOperationEqual = false;

    $("#display").val("0");
    $("#descriptionDisplay").val("");

    updateLocalStorage();

    //reset display to zero. 
    //do not change the rest of the program
}

function checkForSpecialKeys(event)
{
    if (event.keyCode == 8 || event.keyCode == 23) event.preventDefault();

    //still handle clearing for backspace
    if (event.keyCode == 8)
        clearPressed();

    if (event.keyCode == 13)
        equalPressed();

    if (event.which == 27)
        //hits Escape
        allClearPressed();
}

function handleKeystrokes(event)
{
    var charFromKeyPressed = String.fromCharCode(event.which);
    var numbers = ".0123456789";
    var operations = "+-*/";

    //if user enters a number
    if (numbers.indexOf(charFromKeyPressed) != -1)
        numberPressed(charFromKeyPressed);

    if (operations.indexOf(charFromKeyPressed) != -1)
        operationPressed(charFromKeyPressed);

    if (charFromKeyPressed == "=")
        //user hits =
        equalPressed();

}

function drawButton(value, type)
{
    // second arg is 'Num' for numeric button or 'Ops' for operations button
    var htmlForButton = "<div class='buttonBox" + type + "'><button data-value='" + value + "'>" + value + "</button></div>";
    return htmlForButton;
}


$(document).ready(function () {

    //draw operation buttons
    var stringOfOperations = "/*-+";
    var buttonHTMLArray = jQuery.map(stringOfOperations, function (a) {
        return drawButton(a, 'Ops');
    });
    $("#operations").html(buttonHTMLArray.join(""));
    //apply event handler to operation buttons
    $("#operations button").click(function (event) {
        operationButtonPressed($(this));
    })

    //draw numpad buttons
    //blank button is underneath zero
    var stringOfNumpad = "7894561230 .";
    buttonHTMLArray = jQuery.map(stringOfNumpad, function (a) {
        return drawButton(a, 'Num');
    });
    $("#numpad").html(buttonHTMLArray.join(""));
    //apply event handler to numpad buttons
    $("#numpad button").click(function (event) {
        numberButtonPressed($(this));
    });


    $("#clearButton").click(function (event) {
        clearPressed();
    })
    $("#allClearButton").click(function (event) {
        allClearPressed();
    })
    $("#equalButton").click(function (event) {
        equalPressed();
    })

    //handle keystrokes
    $(document).keydown(function (event) {
        checkForSpecialKeys(event);
    });
    $(document).keypress(function (event) {
        handleKeystrokes(event);
    });



    initializeCalculator();
});