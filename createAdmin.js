// Script to create admin user (run once)
const createAdminUser = async () => {
  const adminExists = await userModel.findOne({ email: 'admin@cleanindia.com' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new userModel({
      name: 'Admin',
      email: 'admin@cleanindia.com',
      password: hashedPassword,
      role: 'admin',
      isAccountVerified: true
    });
    await adminUser.save();
    console.log('Admin user created');
  }
};