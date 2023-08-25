import "./style.css";
import axios from "axios";
import { z } from "zod";

const PizzaSchema = z.object ({
  id: z.number(),
  name: z.string(),
  toppings: z.string().array(),
  url: z.string(),
})

type Pizza = z.infer<typeof PizzaSchema>

type Order = {
  name: string,
  zipCode: string,
  items: {
    id: number,
    amount: number
  }[]
}

// app state
let isLoading = false
let pizzas: Pizza[] = []
let selectedPizza: Pizza | null = null
let amount = 0
let order: Order | null = null
let isSending = false

// mutation
const getPizzas = async () => {
  isLoading = true

  const response = await axios.get("http://localhost:3333/api/pizza")
  isLoading = false

  const result = PizzaSchema.array().safeParse(response.data)
  if (!result.success)
    pizzas = []
  else
    pizzas = result.data
}

const selectPizza = (id: number) => {
  selectedPizza = pizzas.find(pizza => pizza.id === id) || null
}

const updateAmount = (num: number) => {
  amount = num
}

const updateOrderWithItem = () => {
  order = order ? {
    name: order.name,
    zipCode: order.zipCode,
    items: [
      ...order.items.filter(item => item.id !== selectedPizza!.id),
      { id: selectedPizza!.id, amount }
    ]
  } : {
    name: "",
    zipCode: "",
    items: [
      { id: selectedPizza!.id, amount }
    ]
  }
}

const removeItemFromOrder = (id:number) => {
  order = {
    name: order!.name,
    zipCode: order!.zipCode,
    items: order!.items.filter((item) => item.id !== id)
  }
}

const addOrderDetails = () => {
  if  (order) {
    order.name = document.getElementById("name") as HTMLInputElement ? (document.getElementById("name") as HTMLInputElement).value : ""
    order.zipCode = document.getElementById("zip") as HTMLInputElement ? (document.getElementById("zip") as HTMLInputElement).value : ""
  }
}


// render
const renderList = (pizzas: Pizza[]) => {
  const container = document.getElementById("list")!

  for (const pizza of pizzas) {
    const pizzaParagraph = document.createElement("p")
    pizzaParagraph.innerText = pizza.name
    pizzaParagraph.id = "" + pizza.id
    container.appendChild(pizzaParagraph)
    pizzaParagraph.addEventListener("click", selectListener)
  }
}

const renderSelected = (pizza: Pizza) => {
  const content = `
    <div>
      <h1>${pizza.name}</h1>
      <p class="bg-red-600">${pizza.toppings}</p>
      <img src="${pizza.url}" />
      <input type="number" id="amount" />
      <button id="add">Add to order</button>
    </div>
  `
  document.getElementById("selected")!.innerHTML = content
  document.getElementById("add")!.addEventListener("click", addListener);
  (document.getElementById("amount") as HTMLInputElement).addEventListener("change", changeListener)
}

const renderOrder = (order: Order) => {

  addOrderDetails()
  
  const content = `
    <div>
      <h1>Your order</h1>
      ${order.items.map(item => `
        <p class="bg-red-500">${item.amount} x ${pizzas.find(pizza => pizza.id === item.id)!.name}</p>
        <button id="remove_${item.id}">Remove item</button>
      `)}
      <input id="name" value="${order.name}" placeholder="Name">
      <input id="zip" value="${order.zipCode}" placeholder="Zip code">
      <button id="send">Send order</button>
    </div>
  `

  document.getElementById("order")!.innerHTML = content

  for (const orderID of order.items) {
    (document.getElementById(`remove_${orderID.id}`) as HTMLButtonElement).addEventListener("click", removeListener)
  }

  (document.getElementById("send") as HTMLButtonElement).addEventListener("click", sendOrder)
}

// eventListeners
const init = async () => {
  await getPizzas()
  if (pizzas.length)
    renderList(pizzas)
}

const selectListener = (event: Event) => {
  selectPizza(+(event.target as HTMLParagraphElement).id)
  if (selectedPizza)
    renderSelected(selectedPizza)
}

const changeListener = (event: Event) => {
  updateAmount(+(event.target as HTMLInputElement).value)
}

const addListener = () => {
  updateOrderWithItem()
  if (order)
    renderOrder(order)
}

const removeListener = (event: Event) => {
  removeItemFromOrder(+(event.target as HTMLButtonElement).id.split("_")[1])
  if(!order!.items.length) {
    order = null
    document.getElementById("order")!.innerHTML = ""
  }
  if (order)
    renderOrder(order)

  console.log(order)
}

const sendOrder = async () => {

  addOrderDetails()

  const response = await axios.post("http://localhost:3333/api/order", JSON.stringify(order), {
    headers: {
      "Content-Type": "application/json"
    }
  })

}

init()