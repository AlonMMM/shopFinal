# shopFinal

README
•         To run the code please upload the server and then enter to localhost:3100.
•	  All the functions work as described in the API attached.
•	  User’s unique ID its his e-mail address, registration with existing e-mail is not  allowed.
•	  Errors and successful responses will be sent to the client, and an informative message will appear in the log.
•	    Our server split the URL path as follow:

	/Admin – for admin actions.
•	/addProduct | /deleteUser |  /deleteProduct | /getInventory | /getOrdersReport | /getAllClients | /addUser
•	 
	/orders – for order related actions.
•	/checkInInventory | /buyProductsInCart |  /approveBuying | /getProductsInOneOrder | /getOrderHistory 
	/users - for user actions (except Login function that occurs in rout path)
•	/registerUser | /verifyUserAndRestorePass |  /getMatchProduct
	/musicalsInstruments - for product related actions.
•	/getAllProducts | /getTop5Products | /latestProducts | /getProductDetails 

•	Database initiates with Admin and User as follow:
Admin: UserMail: a   password: a
User: UserMail: c   password: c 

•	The Recommendation function considers few elements:
	*Products from User categories
	*Products not yet purchased by the customer
	*The most purchased product by other clients.
•	The field “PicturePath” in table “Musical_instrument” get an URL path for the product picture. 

**Note- order creation use these functions:
First, checkInInventory* function checks if the desired amount of product is available. Second, buyProductsInCart  function insert the order records into the right tables and creates the relationship between them. Finally approveBuying function updates the stock amount.
**In case checkInInventory function identifies not all products exist in system or in the desired amount, it will respond with a list of the existing desired musical instruments so the client will be able to decide to continue with the purchase.

•	DELETE - our implementation for delete (user and product) include delete records from all the table that have a relationship with the deleted record. 

Users in DB:
albert@gmail.com
eli@gmail.com
liron@gmail.com
maya@gmail.com
moshe1@gmail.com
omer@gmail.com
shalom@gmail.com
shimi@gmail.com
yossi@gmail.com
eie888@gmail.com

Admins:
eie@gmail.com
admins@gmail.com

Developers:
Alon Mor 200828812
Liron Seliktar 308552900
