import React from 'react';
import CreatePackageForm from '../components/CreatePackageForm';

function CreatePackagePage() {
  const handlePackageCreated = (packageData) => {
    console.log('Paquete creado:', packageData);
    // Aquí puedes agregar lógica adicional, como redireccionar o actualizar lista
  };

  return <CreatePackageForm onPackageCreated={handlePackageCreated} />;
}

export default CreatePackagePage;
