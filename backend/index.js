const express = require('express');
const app = express();
const port = 8080;
const cors = require('cors');
const path = require('path');

app.use(cors())
app.use(express.json());

const categoriesRouter = require('./routers/categories');
const promotionsRouter = require('./routers/promotions')
const productsRouter = require('./routers/productions');
const loginRouter = require('./routers/login')
const ordersRouter = require('./routers/orders')
const usersRouter = require('./routers/users')



app.use('/api/categories', categoriesRouter);
app.use('/api/promotions',promotionsRouter)
app.use('/api/products',productsRouter)
app.use('/api/login',loginRouter)
app.use('/api/orders',ordersRouter)
app.use('/api/users',usersRouter)
app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(port, () => {
  console.log(`app is listening at http://localhost:${port}`);
});