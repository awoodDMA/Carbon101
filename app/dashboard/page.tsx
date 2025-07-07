export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Projects</h3>
          </div>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 from last month</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Carbon Calculated</h3>
          </div>
          <div className="text-2xl font-bold">1,247 tCO₂e</div>
          <p className="text-xs text-muted-foreground">+12% efficiency</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Models Uploaded</h3>
          </div>
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">+4 this week</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Users</h3>
          </div>
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">+2 new users</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold leading-none tracking-tight mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Office Building Project updated</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Carbon calculation completed</p>
                <p className="text-sm text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">New Revit model uploaded</p>
                <p className="text-sm text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-3 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold leading-none tracking-tight mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
              Create New Project
            </button>
            <button className="w-full text-left p-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
              Upload Model
            </button>
            <button className="w-full text-left p-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
              View Reports
            </button>
            <button className="w-full text-left p-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}