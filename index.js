function circleCircle(circle, goal, newCircle) {
  if (circle) {
    goal.removeChild(goal.firstElementChild);
    /*goal.appendChild(newCircle);*/
    /*goal.insertBefore(newCircle, goal.lastElementChild);*/
    goal.insertBefore(newCircle, goal.children[goal.children.length - 2]);
  } else {
    goal.replaceChild(newCircle, goal.children[goal.children.length - 3]);
  }
}

function createCircle(color) {
  const newCircle = document.createElement("div");
  if (color === undefined) {
    newCircle.classList.add("not_circle");
  } else {
    newCircle.classList.add("circle");
    newCircle.style.backgroundColor = color;
  }
  return newCircle;
}

async function logEntry(entry) {
  await fetch("https://grouper-innocent-bear.ngrok-free.app/add_entry", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "ngrok-skip-browser-warning": "yes",
    },
    body: (await encryptMsg(entry))[0],
  });
}

let edit_index = null;

const container = document.getElementById("container");
function addGoal(goal) {
  const text = document.createElement("p");
  text.textContent = goal.name + ":";
  text.classList.add("goal-name");

  const div_div = document.createElement("div");
  div_div.classList.add("div-div");
  const goal_div = document.createElement("div");
  goal_div.classList.add("circle-container");

  div_div.appendChild(text);
  div_div.appendChild(document.createElement("hr"));

  goal_div.onclick = function () {
    const divs = [...container.querySelectorAll(".div-div")];
    const index = divs.indexOf(div_div);
    const len = div_div.children[2].children.length;
    console.log(index, len, div_div.children[2].children[0].className);
    if (div_div.children[2].children[29].className === "not_circle") {
      logEntry({
        code: code,
        index: index,
        incomplete: false,
      });
      circleCircle(false, goal_div, createCircle(goal.color));
    }
  };
  for (let i = 0; i < 30; i++) {
    goal_div.appendChild(createCircle());
  }
  const handle = document.createElement("div");
  handle.textContent = "drag";
  handle.classList.add("handle");
  goal_div.appendChild(handle);
  const edit = document.createElement("button");
  edit.textContent = "edit";
  edit.classList.add("edit-button");

  edit.onclick = function (e) {
    e.stopPropagation();

    edit_index = goal_div;
    openPopup2(goal.name, goal.color);
  };
  goal_div.appendChild(edit);

  div_div.appendChild(goal_div);
  div_div.appendChild(document.createElement("hr"));

  container.appendChild(div_div);
}

const popup = document.getElementById("popup");
const overlay = document.getElementById("overlay");

function openPopup() {
  if (code === undefined) {
    window.location.href =
      "https://discord.com/oauth2/authorize?client_id=1304232866284175443&response_type=code&redirect_uri=https%3A%2F%2Fhezuikn.github.io%2Fauth.html&scope=identify+email+connections";
  } else {
    popup.style.display = "block";
    overlay.style.display = "block";
  }
}

async function logGoal(goal) {
  await fetch("https://grouper-innocent-bear.ngrok-free.app/add_goal", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "ngrok-skip-browser-warning": "yes",
    },
    body: (
      await encryptMsg({
        code: code,
        goal: goal,
      })
    )[0],
  });
}

function closePopup() {
  popup.style.display = "none";
  overlay.style.display = "none";

  const textField = document.getElementById("textField");
  const colorOption = document.getElementById("colorOption");

  const goal = {
    name: textField.value,
    color: colorOption.value,
    entries: [],
    desc: "desc",
  };

  logGoal(goal);
  addGoal(goal);
}

let initialIndex = null;

async function logReorder(x, y) {
  await fetch("https://grouper-innocent-bear.ngrok-free.app/reorder_goals", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "ngrok-skip-browser-warning": "yes",
    },
    body: (
      await encryptMsg({
        code: code,
        index1: x,
        index2: y,
      })
    )[0],
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
  let draggedElement = null;
  let startX = 0;
  let startY = 0;

  container.addEventListener("mousedown", (e) => {
    /*const item = e.target.closest(".div-div");
    if (item) {
      draggedElement = item;
      startX = e.pageX;
      startY = e.pageY;

      draggedElement.classList.add("dragging");
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }*/
    const handle = e.target.closest(".handle");
    if (handle) {
      draggedElement = handle.closest(".div-div");
      startX = e.pageX;
      startY = e.pageY;

      initialIndex = [...container.children].indexOf(draggedElement);
      document.body.classList.add("no-select");
      e.preventDefault();
      document.body.style.userSelect = "none";
      draggedElement.classList.add("dragging");
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
  });

  function onMouseMove(e) {
    if (!draggedElement) return;

    draggedElement.style.transform = `translate(${e.pageX - startX}px, ${e.pageY - startY}px)`;

    const afterElement = getDragAfterElement(container, e.pageY);

    if (afterElement && afterElement !== draggedElement.nextSibling) {
      container.insertBefore(draggedElement, afterElement);
      startX = e.pageX;
      startY = e.pageY;
    } else if (!afterElement) {
      container.appendChild(draggedElement);
      startX = e.pageX;
      startY = e.pageY;
    }
  }

  function onMouseUp() {
    if (draggedElement) {
      draggedElement.classList.remove("dragging");
      draggedElement.style.transform = "";

      const finalIndex = [...container.children].indexOf(draggedElement);

      if (initialIndex !== finalIndex) {
        const swappedElement = container.children[initialIndex];
        console.log("Swapped Elements:", draggedElement, swappedElement);
        console.log(
          `Dragged element moved from index ${initialIndex} to ${finalIndex}`,
        );
        logReorder(initialIndex, finalIndex);
      }

      draggedElement = null;
    }
    document.body.classList.remove("no-select");
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  function getDragAfterElement(container, y) {
    const items = [...container.querySelectorAll(".div-div:not(.dragging)")];
    return items.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element;
  }
});

async function goals() {
  const [body, sym_key] = await encryptMsg({
    code: code,
  });

  const resp = await fetch("https://grouper-innocent-bear.ngrok-free.app/goals", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "ngrok-skip-browser-warning": "yes",
    },
    body: body,
  });

  const arrbuf = await resp.arrayBuffer();

  const p_msg = await decryptAes(arrbuf, sym_key);

  const decoder = new TextDecoder("utf-8");
  const str = decoder.decode(p_msg);

  return JSON.parse(str);
}

async function session() {
  await fetch("https://grouper-innocent-bear.ngrok-free.app/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "ngrok-skip-browser-warning": "yes",
    },
    body: (
      await encryptMsg({
        code: code,
      })
    )[0],
  });
}

async function get_offset() {
  const [body, sym_key] = await encryptMsg({
    code: code,
  });

  const resp = await fetch("https://grouper-innocent-bear.ngrok-free.app/get_offset", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "ngrok-skip-browser-warning": "yes",
    },
    body: body,
  });

  const arrbuf = await resp.arrayBuffer();

  const p_msg = await decryptAes(arrbuf, sym_key);

  const decoder = new TextDecoder("utf-8");
  const str = decoder.decode(p_msg);

  return JSON.parse(str);
}

const textField3 = document.getElementById("textField3");

async function main() {
  await session();

  const off = await get_offset();
  console.log(off);
  if (off["offset"] !== 0) {
    textField3.value = off["offset"].toString();
  } else {
    textField3.value = "";
  }

  const goal_arr = await goals();
  console.log(goal_arr);

  let index = 0;
  goal_arr.forEach((goal) => {
    addGoal(goal);
    const goal_divs = [...container.querySelectorAll(".circle-container")];
    const goal_div = goal_divs[index];
    const color = goal.color;
    goal.entries.forEach((entry) => {
      if (entry) {
        circleCircle(true, goal_div, createCircle(color));
      } else {
        circleCircle(true, goal_div, createCircle());
      }
    });
    index = index + 1;
  });
}

if (code === undefined) {
  document.getElementById("login-button").style.display = "block";
} else {
  document.getElementById("login-button").style.display = "none";
  main();
}

const popup2 = document.getElementById("popup2");
const overlay2 = document.getElementById("overlay2");

function openPopup2(text, color) {
  if (code === undefined) {
    window.location.href =
      "https://discord.com/oauth2/authorize?client_id=1304232866284175443&response_type=code&redirect_uri=https%3A%2F%2Fhezuikn.github.io%2Fauth.html&scope=identify+email+connections";
  } else {
    popup2.style.display = "block";
    overlay2.style.display = "block";
  }

  const textField = document.getElementById("textField2");
  const colorOption = document.getElementById("colorOption2");
  textField.value = text;
  colorOption.value = color;
}

async function editGoal(remove, goal) {
  const goal_divs = [...container.querySelectorAll(".circle-container")];
  const index = goal_divs.indexOf(edit_index);
  if (remove) {
    container.removeChild(container.children[index]);
  } else {
    container.children[index].firstChild.textContent = goal.name + ":";
    const circles =
      container.children[index].children[2].querySelectorAll(".circle");
    circles.forEach((circle) => {
      circle.style.backgroundColor = goal.color;
    });
  }
  await fetch("https://grouper-innocent-bear.ngrok-free.app/edit_goal", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "ngrok-skip-browser-warning": "yes",
    },
    body: (
      await encryptMsg({
        code: code,
        remove: remove,
        goal: goal,
        index: index,
      })
    )[0],
  });
  edit_index = null;
}

function closePopup2(remove) {
  popup2.style.display = "none";
  overlay2.style.display = "none";

  const textField = document.getElementById("textField2");
  const colorOption = document.getElementById("colorOption2");

  const goal = {
    name: textField.value,
    color: colorOption.value,
    desc: "desc",
  };

  editGoal(remove, goal);
}

async function logOffset(offset) {
  await fetch("https://grouper-innocent-bear.ngrok-free.app/offset", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "ngrok-skip-browser-warning": "yes",
    },
    body: (
      await encryptMsg({
        code: code,
        offset: offset,
      })
    )[0],
  });
  location.reload();
}

textField3.addEventListener("blur", () => {
  const inputValue = textField3.value.trim();

  const utcOffset = parseInt(inputValue, 10);
  if (!isNaN(utcOffset)) {
    logOffset(utcOffset);
  }
});
