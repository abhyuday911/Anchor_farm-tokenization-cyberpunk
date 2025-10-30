"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sprout, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from 'next/link';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Marketplace", href: "#marketplace" },
        { label: "Documentation", href: "#docs" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center group-hover:glow-primary transition-all">
                            <Sprout className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            FarmToken
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" className="text-muted-foreground hover:text-primary">
                            Connect Wallet
                        </Button>
                        <Button className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                            Launch App
                        </Button>
                    </div>

                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] bg-card">
                            <div className="flex flex-col gap-6 mt-8">
                                {menuItems.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className="text-lg text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                                <div className="flex flex-col gap-3 mt-4">
                                    <Button variant="outline" className="w-full">
                                        Connect Wallet
                                    </Button>
                                    <Button className="w-full bg-gradient-hero text-primary-foreground">
                                        Launch App
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;