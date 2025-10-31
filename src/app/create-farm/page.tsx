"use client"
import Navigation from '@/components/Navigation'
import React from 'react'

const CreateFarm = () => {

    const handleSubmit = (event) => {
        event.preventDefault();

        // derive pdas
        // call the initialize farm instruction 
        // user bc signs the shit

    }
    return (
        <div className='min-h-screen'>
            <Navigation />
            <form onSubmit={handleSubmit}></form>
        </div>
    )
}

export default CreateFarm