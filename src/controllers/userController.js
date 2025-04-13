// src/controllers/userController.js
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError.js');

// @desc    Actualizar ubicación del usuario logueado
// @route   PUT /api/users/me/location  (o tal vez /api/auth/me/location)
// @access  Private
const updateUserLocation = asyncHandler(async (req, res, next) => {
    // Validar datos de ubicación con express-validator en la ruta
    const { department, province, municipality, zone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id, // ID del usuario logueado desde 'protect'
        { location: { department, province, municipality, zone } },
        { new: true, runValidators: true } // Devolver usuario actualizado y correr validaciones
    ).select('-password'); // Excluir contraseña

    if (!updatedUser) {
        return next(new AppError('Usuario no encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser // Devolver el perfil actualizado
        }
    });
});

// Puedes añadir más funciones aquí si necesitas (ej. cambiar contraseña, actualizar perfil)


module.exports = {
    updateUserLocation,
};