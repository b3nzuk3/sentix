"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
const navigation_1 = require("next/navigation");
const authStore_1 = require("@/stores/authStore");
const button_1 = require("@sentix/ui/components/button");
const dropdown_menu_1 = require("@sentix/ui/components/dropdown-menu");
const avatar_1 = require("@sentix/ui/components/avatar");
const project_selector_1 = require("./project-selector");
const lucide_react_1 = require("lucide-react");
function Header() {
    const router = (0, navigation_1.useRouter)();
    const { user, org, logout } = (0, authStore_1.useAuthStore)();
    const handleLogout = () => {
        logout();
        router.push('/login');
    };
    return (<header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold cursor-pointer glow" onClick={() => router.push('/')}>
            Sentix
          </h1>
          <project_selector_1.ProjectSelector />
        </div>

        <div className="flex items-center gap-4">
          {org && (<div className="flex items-center gap-2 text-sm text-muted-foreground">
              <lucide_react_1.Building className="h-4 w-4"/>
              <span>{org.name}</span>
            </div>)}
          <dropdown_menu_1.DropdownMenu>
            <dropdown_menu_1.DropdownMenuTrigger asChild>
              <button_1.Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <avatar_1.Avatar className="h-8 w-8">
                  <avatar_1.AvatarImage src={undefined} alt={user?.name || ''}/>
                  <avatar_1.AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </avatar_1.AvatarFallback>
                </avatar_1.Avatar>
              </button_1.Button>
            </dropdown_menu_1.DropdownMenuTrigger>
            <dropdown_menu_1.DropdownMenuContent className="w-56" align="end" forceMount>
              <dropdown_menu_1.DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </dropdown_menu_1.DropdownMenuLabel>
              <dropdown_menu_1.DropdownMenuSeparator />
              <dropdown_menu_1.DropdownMenuItem onClick={() => router.push('/profile')}>
                <lucide_react_1.User className="mr-2 h-4 w-4"/>
                <span>Profile</span>
              </dropdown_menu_1.DropdownMenuItem>
              <dropdown_menu_1.DropdownMenuSeparator />
              <dropdown_menu_1.DropdownMenuItem onClick={handleLogout}>
                <lucide_react_1.LogOut className="mr-2 h-4 w-4"/>
                <span>Log out</span>
              </dropdown_menu_1.DropdownMenuItem>
            </dropdown_menu_1.DropdownMenuContent>
          </dropdown_menu_1.DropdownMenu>
        </div>
      </div>
    </header>);
}
//# sourceMappingURL=header.js.map