import { Card, CardContent, Typography, Button, Avatar } from "@mui/material";
import useAuth from "../hooks/useAuth";
import { MdEdit } from "react-icons/md";

export const Profile = () => {
    const { auth } = useAuth();

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="mb-8">
                <Typography variant="h4" className="font-bold text-slate-900 mb-2">
                    User Profile
                </Typography>
                <Typography variant="body1" color="text.secondary" className="text-slate-600">
                    Manage your account information
                </Typography>
            </div>

            <Card className="rounded-xl shadow-lg border-0 bg-white">
                <CardContent className="p-8">
                    {/* Profile Header */}
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200">
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                bgcolor: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                                fontSize: '2.5rem'
                            }}
                        >
                            {auth?.email?.[0].toUpperCase()}
                        </Avatar>
                        <div className="flex-1">
                            <Typography variant="h5" className="font-bold text-slate-900">
                                {auth?.email || "User"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="mt-2">
                                {auth?.roles?.map(role => role.replace('ROLE_', '')).join(', ') || 'User'}
                            </Typography>
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <Typography variant="caption" className="text-slate-600 font-semibold">
                                Email Address
                            </Typography>
                            <Typography variant="body1" className="mt-2 font-medium text-slate-900">
                                {auth?.email}
                            </Typography>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg">
                            <Typography variant="caption" className="text-slate-600 font-semibold">
                                Role(s)
                            </Typography>
                            <div className="flex gap-2 mt-2">
                                {auth?.roles?.map((role, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold"
                                    >
                                        {role.replace('ROLE_', '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8 pt-8 border-t border-slate-200">
                        <Button
                            variant="outlined"
                            startIcon={<MdEdit size={20} />}
                            className="flex-1"
                            disabled
                        >
                            Edit Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};