const adminOnly = (req, res, next) => {

    if (req.user.role !== "Admin") {

        return res.status(403).json({
            success: false,
            message: "Admin Access Required"
        });

    }

    next();
};

const managerOnly = (req,res,next)=>{

    if(req.user.role !== "Manager"){
        return res.status(403).json({
            success:false,
            message:"Manager Access Required"
        });
    }

    next();
};

const employeeOnly = (req,res,next)=>{

    if(req.user.role !== "Employee"){
        return res.status(403).json({
            success:false,
            message:"Employee Access Required"
        });
    }

    next();
};

const adminOrManager = (req, res, next) => {
    if (req.user.role !== "Admin" && req.user.role !== "Manager") {
        return res.status(403).json({
            success: false,
            message: "Admin or Manager Access Required"
        });
    }
    next();
};

module.exports = {
    adminOnly,
    managerOnly,
    employeeOnly,
    adminOrManager
};