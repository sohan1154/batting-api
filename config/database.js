
const connectionConfig = config.databaseConf;

exports.createDatabaseConnection = (req, res, next) => {

    const connection = mysql.createConnection(connectionConfig);

    connection.connect(function (err) {
        if (err) {
            console.log('::::::::::::DATABASE CONNECTION ERROR::::::::::::');
            console.error(err.message)
            // throw err;
            res.status(203);
            res.json({ status: false, message: 'Error in database connection.' });

            return next(false);
        } else {
            // console.log("Database Connected!");
            req.connection = connection;
            return next();
        }
    });

    connection.on('error', function (err) {
        console.log('connection error::::::::::::::::', err); // 'ER_BAD_DB_ERROR'
    });

}
